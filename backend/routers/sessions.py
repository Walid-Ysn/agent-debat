"""
routers/sessions.py
Endpoints pour créer et gérer les sessions de débat.
"""
import uuid, shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db, DebateSession
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

class SessionCreate(BaseModel):
    title:    str
    decision: str
    context:  Optional[str] = ""
    domain:   Optional[str] = "RH"

class SessionOut(BaseModel):
    id:         str
    title:      str
    decision:   str
    context:    str
    domain:     str
    status:     str
    created_at: str

    class Config:
        from_attributes = True

# ── Create session ────────────────────────────────────────────────────────────
@router.post("/", response_model=SessionOut)
async def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    session = DebateSession(
        id       = str(uuid.uuid4()),
        title    = payload.title,
        decision = payload.decision,
        context  = payload.context or "",
        domain   = payload.domain or "RH",
        status   = "PENDING",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {**session.__dict__, "created_at": str(session.created_at)}

# ── Upload documents ──────────────────────────────────────────────────────────
@router.post("/{session_id}/upload")
async def upload_document(
    session_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    from rag.pipeline import ingest_document

    session = db.query(DebateSession).filter(DebateSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    allowed = {".pdf", ".docx", ".doc", ".csv", ".xlsx", ".txt"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Format non supporté : {ext}")

    # Sauvegarde du fichier
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir(exist_ok=True)
    file_path = session_dir / file.filename

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Ingestion RAG
    chunks_count = await ingest_document(session_id, str(file_path))

    return {
        "filename": file.filename,
        "chunks":   chunks_count,
        "message":  f"Document indexé avec succès ({chunks_count} chunks)",
    }

# ── Get all sessions ──────────────────────────────────────────────────────────
@router.get("/")
async def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(DebateSession).order_by(DebateSession.created_at.desc()).all()
    return [
        {**s.__dict__, "created_at": str(s.created_at)}
        for s in sessions
    ]

# ── Get single session ────────────────────────────────────────────────────────
@router.get("/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DebateSession).filter(DebateSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")
    return {**session.__dict__, "created_at": str(session.created_at)}
