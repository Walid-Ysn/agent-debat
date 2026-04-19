"""
routers/debate.py
Endpoints du débat : lancer un round, poser une question, WebSocket streaming.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from database import get_db, DebateSession, Argument
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class QuestionPayload(BaseModel):
    question:   str
    agent_type: str  # POUR | CONTRE


async def _safe_retrieve_context(session_id: str, query: str, k: int) -> str:
    try:
        from rag.pipeline import retrieve_context
        return await retrieve_context(session_id, query, k=k)
    except Exception:
        # If embeddings/model download is not ready yet, continue debate without RAG.
        return ""


def _raise_llm_unavailable(err: Exception):
    raise HTTPException(
        status_code=503,
        detail=f"LLM indisponible. Vérifie Ollama (ollama serve + modèle). Détail: {err}",
    )

# ── Helper : reconstruct full debate history ──────────────────────────────────
def get_all_arguments_text(session_id: str, db: Session) -> str:
    args = (
        db.query(Argument)
        .filter(Argument.session_id == session_id)
        .order_by(Argument.round_number, Argument.id)
        .all()
    )
    if not args:
        return ""
    lines = []
    for a in args:
        lines.append(f"[{a.agent_type} — Round {a.round_number}]\n{a.content}\n")
    return "\n---\n".join(lines)

# ── Round 1 : independent generation ─────────────────────────────────────────
@router.post("/{session_id}/round/1")
async def run_round_1(session_id: str, db: Session = Depends(get_db)):
    from agents.core import run_agent_pour, run_agent_contre

    session = db.query(DebateSession).filter(DebateSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session introuvable")

    # RAG context retrieval
    rag_context = await _safe_retrieve_context(session_id, session.decision, k=5)
    full_context = f"{session.context}\n\n{rag_context}".strip()

    # Both agents generate independently (no cross-visibility)
    try:
        arg_pour = await run_agent_pour(session.decision, full_context, round=1)
        arg_contre = await run_agent_contre(session.decision, full_context, round=1)
    except Exception as e:
        _raise_llm_unavailable(e)

    # Save to DB
    db.add(Argument(session_id=session_id, agent_type="POUR",   round_number=1, content=arg_pour))
    db.add(Argument(session_id=session_id, agent_type="CONTRE", round_number=1, content=arg_contre))
    session.status = "DEBATING"
    db.commit()

    return {"pour": arg_pour, "contre": arg_contre, "round": 1}

# ── Round 2 : refutations ─────────────────────────────────────────────────────
@router.post("/{session_id}/round/2")
async def run_round_2(session_id: str, db: Session = Depends(get_db)):
    from agents.core import run_agent_pour, run_agent_contre

    session = db.query(DebateSession).filter(DebateSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session introuvable")

    # Get previous arguments
    args = db.query(Argument).filter(
        Argument.session_id == session_id,
        Argument.round_number == 1
    ).all()

    pour_r1   = next((a.content for a in args if a.agent_type == "POUR"),   "")
    contre_r1 = next((a.content for a in args if a.agent_type == "CONTRE"), "")

    rag_context = await _safe_retrieve_context(session_id, session.decision, k=3)
    full_context = f"{session.context}\n\n{rag_context}".strip()

    # Agent Pour refutes Contre's arguments, and vice versa
    try:
        refutation_pour = await run_agent_pour(session.decision, full_context, round=2, contre_args=contre_r1)
        refutation_contre = await run_agent_contre(session.decision, full_context, round=2, pour_args=pour_r1)
    except Exception as e:
        _raise_llm_unavailable(e)

    db.add(Argument(session_id=session_id, agent_type="POUR",   round_number=2, content=refutation_pour))
    db.add(Argument(session_id=session_id, agent_type="CONTRE", round_number=2, content=refutation_contre))
    db.commit()

    return {"pour": refutation_pour, "contre": refutation_contre, "round": 2}

# ── Arbitre : final verdict ───────────────────────────────────────────────────
@router.post("/{session_id}/arbitre")
async def run_arbitre(session_id: str, db: Session = Depends(get_db)):
    from agents.core import run_agent_arbitre

    session = db.query(DebateSession).filter(DebateSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session introuvable")

    all_args = get_all_arguments_text(session_id, db)
    try:
        verdict = await run_agent_arbitre(session.decision, all_args)
    except Exception as e:
        _raise_llm_unavailable(e)

    db.add(Argument(session_id=session_id, agent_type="ARBITRE", round_number=99, content=verdict))
    session.status = "FINISHED"
    db.commit()

    return {"verdict": verdict}

# ── Question from decision makers ─────────────────────────────────────────────
@router.post("/{session_id}/question")
async def ask_question(session_id: str, payload: QuestionPayload, db: Session = Depends(get_db)):
    from agents.core import run_agent_question

    session = db.query(DebateSession).filter(DebateSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session introuvable")

    rag_context = await _safe_retrieve_context(session_id, payload.question, k=3)
    full_context = f"Décision : {session.decision}\n{session.context}\n{rag_context}"

    try:
        answer = await run_agent_question(payload.question, full_context, payload.agent_type)
    except Exception as e:
        _raise_llm_unavailable(e)

    return {"agent": payload.agent_type, "question": payload.question, "answer": answer}

# ── Get all arguments for a session ──────────────────────────────────────────
@router.get("/{session_id}/arguments")
async def get_arguments(session_id: str, db: Session = Depends(get_db)):
    args = (
        db.query(Argument)
        .filter(Argument.session_id == session_id)
        .order_by(Argument.round_number, Argument.id)
        .all()
    )
    return [
        {
            "id":           a.id,
            "agent_type":   a.agent_type,
            "round_number": a.round_number,
            "content":      a.content,
            "score":        a.score,
            "created_at":   str(a.created_at),
        }
        for a in args
    ]

# ── WebSocket : real-time streaming of a single agent ────────────────────────
@router.websocket("/{session_id}/ws/{agent_type}")
async def debate_websocket(
    websocket: WebSocket,
    session_id: str,
    agent_type: str,
    db: Session = Depends(get_db),
):
    from agents.core import stream_agent, PROMPT_POUR, PROMPT_CONTRE, PROMPT_REFUTATION_POUR, PROMPT_REFUTATION_CONTRE

    """
    WebSocket endpoint for real-time argument streaming.
    agent_type: POUR | CONTRE
    Client sends JSON: { "round": 1, "contre_args": "..." }
    Server streams tokens as they're generated.
    """
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        payload = json.loads(data)

        session = db.query(DebateSession).filter(DebateSession.id == session_id).first()
        if not session:
            await websocket.send_text(json.dumps({"error": "Session introuvable"}))
            return

        round_num   = payload.get("round", 1)
        contre_args = payload.get("contre_args", "")
        pour_args   = payload.get("pour_args", "")

        rag_context = await _safe_retrieve_context(session_id, session.decision, k=5)
        full_context = f"{session.context}\n\n{rag_context}".strip()

        # Build prompt based on agent and round
        if agent_type == "POUR":
            system = PROMPT_POUR if round_num == 1 else PROMPT_REFUTATION_POUR
        else:
            system = PROMPT_CONTRE if round_num == 1 else PROMPT_REFUTATION_CONTRE

        user_content = f"Décision : {session.decision}\n\nContexte : {full_context}"
        if round_num > 1:
            opponent = contre_args if agent_type == "POUR" else pour_args
            user_content += f"\n\nArguments adverses à réfuter :\n{opponent}"

        # Stream tokens to frontend
        full_response = ""
        async for token in stream_agent(system, user_content):
            full_response += token
            await websocket.send_text(json.dumps({"token": token, "done": False}))

        # Signal completion and save
        await websocket.send_text(json.dumps({"token": "", "done": True}))
        db.add(Argument(
            session_id   = session_id,
            agent_type   = agent_type,
            round_number = round_num,
            content      = full_response,
        ))
        db.commit()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_text(json.dumps({"error": str(e)}))
    finally:
        await websocket.close()
