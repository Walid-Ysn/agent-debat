from __future__ import annotations

import hashlib
import math
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import Argument, DebateSession, get_db

router = APIRouter()
UPLOAD_DIR = Path("uploads")

_STOPWORDS = {
    "de",
    "la",
    "le",
    "les",
    "des",
    "du",
    "et",
    "ou",
    "en",
    "un",
    "une",
    "pour",
    "sur",
    "avec",
    "dans",
    "the",
    "and",
    "of",
    "to",
    "for",
}


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _safe_div(num: float, den: float) -> float:
    if den == 0:
        return 0.0
    return num / den


def _hash_unit(seed: str) -> float:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return int(digest[:12], 16) / float(0xFFFFFFFFFFFF)


def _hash_range(seed: str, lower: float, upper: float) -> float:
    return lower + (_hash_unit(seed) * (upper - lower))


def _evidence_count(session_id: str) -> int:
    session_path = UPLOAD_DIR / session_id
    if not session_path.exists() or not session_path.is_dir():
        return 0
    return len([item for item in session_path.iterdir() if item.is_file()])


def _keywords(decision: str, fallback: str) -> list[str]:
    words = []
    for raw in decision.replace("-", " ").split():
        clean = "".join(ch for ch in raw.lower() if ch.isalnum())
        if len(clean) < 4 or clean in _STOPWORDS:
            continue
        words.append(clean)
    if not words:
        words = [fallback.lower(), "strategy", "execution"]
    unique_words = []
    for word in words:
        if word not in unique_words:
            unique_words.append(word)
        if len(unique_words) == 3:
            break
    while len(unique_words) < 3:
        unique_words.append(f"axis{len(unique_words) + 1}")
    return unique_words


def _shape_curve(points: int, baseline: float, growth: float, volatility: float, seed: str) -> list[float]:
    values = []
    for idx in range(points):
        progress = _safe_div(idx, max(points - 1, 1))
        trend = baseline + (growth * progress)
        wave = math.sin((progress * math.pi * 2.2) + (_hash_unit(seed) * math.pi)) * volatility
        jitter = _hash_range(f"{seed}:{idx}", -2.8, 2.8)
        values.append(round(_clamp(trend + wave + jitter, 0.0, 100.0), 2))
    return values


def _compute_session_profile(session: DebateSession, arguments: list[Argument]) -> dict[str, Any]:
    base_seed = f"{session.id}|{session.title}|{session.decision}|{session.context}|{session.domain}"
    evidence = _evidence_count(session.id)

    all_text = " ".join(a.content for a in arguments)
    word_count = len(all_text.split())
    unique_words = len({w.lower().strip(".,:;!?()[]{}\"'") for w in all_text.split() if w.strip()})
    lexical_diversity = _safe_div(unique_words, max(word_count, 1))

    round1_count = len([a for a in arguments if a.round_number == 1])
    round2_count = len([a for a in arguments if a.round_number == 2])
    question_count = len([a for a in arguments if a.round_number == 50])
    verdict_count = len([a for a in arguments if a.agent_type == "ARBITRE"])

    if session.status == "FINISHED" or verdict_count > 0:
        stage = "done"
        progress = 100.0
    elif round2_count > 0:
        stage = "questions"
        progress = _clamp(62 + (question_count * 7) + (evidence * 2.5), 0.0, 95.0)
    elif round1_count > 0:
        stage = "round2"
        progress = _clamp(35 + (round1_count * 9) + (evidence * 2), 0.0, 70.0)
    elif session.status == "DEBATING":
        stage = "round1"
        progress = _clamp(18 + (evidence * 3), 0.0, 34.0)
    else:
        stage = "idle"
        progress = 0.0

    context_size = len((session.context or "").split())
    decision_size = len((session.decision or "").split())
    complexity = _clamp((decision_size * 1.5) + (context_size * 0.7) + (evidence * 6), 0.0, 100.0)

    quality = _clamp((lexical_diversity * 65) + (_safe_div(word_count, 40)), 0.0, 100.0)
    conflict_signals = int(round(_clamp((round1_count + round2_count) * 4 + question_count * 3 + _hash_range(base_seed, 0, 6), 0.0, 100.0)))

    confidence_ratio = _clamp(
        (progress * 0.52 + quality * 0.22 + complexity * 0.16 + _hash_range(base_seed, -8.0, 8.0)) / 100.0,
        0.0,
        1.0,
    )

    argument_weights = _clamp(progress * 0.7 + quality * 0.2 + _hash_range(base_seed, -6.0, 6.0), 0.0, 100.0)
    economic_efficiency = _clamp(28 + progress * 0.45 + evidence * 2.4 + _hash_range(base_seed + "eco", -10, 10), 0.0, 100.0)
    talent_risk = _clamp(72 - progress * 0.33 + question_count * 1.8 + _hash_range(base_seed + "risk", -12, 12), 0.0, 100.0)
    execution_speed = _clamp(18 + progress * 0.58 + _hash_range(base_seed + "speed", -9, 9), 0.0, 100.0)
    time_to_impact = int(round(_clamp(120 - progress * 0.75 - evidence * 2.8 + _hash_range(base_seed + "impact", -7, 7), 8, 120)))

    throughput = {
        "talent_acquisition_score": round(_clamp(22 + complexity * 0.55 + progress * 0.24 + _hash_range(base_seed + "ta", -7, 7), 0.0, 100.0), 2),
        "workforce_planning_index": round(_clamp(18 + complexity * 0.42 + progress * 0.31 + _hash_range(base_seed + "wp", -8, 8), 0.0, 100.0), 2),
        "strategic_governance_rating": round(_clamp(20 + quality * 0.44 + progress * 0.34 + _hash_range(base_seed + "sg", -9, 9), 0.0, 100.0), 2),
    }

    enterprise_curve = _shape_curve(
        points=8,
        baseline=_clamp(10 + complexity * 0.2, 0.0, 60.0),
        growth=_clamp(progress * 0.85, 0.0, 90.0),
        volatility=_clamp(18 - confidence_ratio * 12, 3.0, 18.0),
        seed=base_seed,
    )

    keywords = _keywords(session.decision or "", session.domain or "strategy")
    scenario_paths = [
        {
            "level": "Root",
            "node": f"Prioritize {keywords[0]} alignment",
            "impact": "Baseline strategic orientation",
            "path": "Path 1",
        },
        {
            "level": "Branch A",
            "node": f"Accelerate {keywords[1]} program",
            "impact": "Higher short-term momentum with controlled risk",
            "path": "Path 2",
        },
        {
            "level": "Branch B",
            "node": f"Balance {keywords[2]} with operational resilience",
            "impact": "Moderate speed with stronger long-term stability",
            "path": "Path 3",
        },
    ]

    simulation_active = progress > 0
    thinking_active = stage in {"round1", "round2", "questions"}
    live_feed_activity = int(round(_clamp(question_count * 7 + len(arguments) * 5 + _hash_range(base_seed + "live", 0, 20), 0, 100)))

    report_available = progress >= 68 or stage == "done"

    return {
        "session_id": session.id,
        "stage": stage,
        "progress": round(progress, 2),
        "complexity": round(complexity, 2),
        "evidence_count": evidence,
        "interactions": {
            "arguments": len(arguments),
            "questions": question_count,
        },
        "performance": {
            "debate_throughput": throughput,
            "live_feed_activity": live_feed_activity,
            "enterprise_confidence_curve": enterprise_curve,
            "operational_momentum": round(_clamp(progress * 0.8 + quality * 0.2, 0.0, 100.0), 2),
        },
        "ai_decision": {
            "argument_weights": round(argument_weights, 2),
            "conflict_signals": conflict_signals,
            "strategy_confidence_score": round(confidence_ratio, 2),
            "economic_efficiency": round(economic_efficiency, 2),
            "talent_risk": round(talent_risk, 2),
            "execution_speed": round(execution_speed, 2),
            "time_to_impact": time_to_impact,
        },
        "simulation": {
            "adaptive_decision_tree": {
                "economic_efficiency": round(economic_efficiency, 2),
                "talent_risk": round(talent_risk, 2),
                "execution_speed": round(execution_speed, 2),
                "time_to_impact": time_to_impact,
            },
            "scenario_decision_paths": scenario_paths,
        },
        "modules": {
            "strategy_simulation": simulation_active,
            "adaptive_decision_tree": simulation_active,
            "scenario_decision_paths": simulation_active,
            "decision_mechanism_3d": simulation_active,
            "cognitive_engine": simulation_active,
            "live_simulation_engine": thinking_active,
            "ai_thinking_loop_status": thinking_active,
            "standby_mode": not simulation_active,
        },
        "report": {
            "available": report_available,
            "reason": "progress_threshold" if report_available and stage != "done" else ("completed" if stage == "done" else "insufficient_progress"),
        },
    }


_EMPTY_OVERVIEW = {
    "performance_metrics": {
        "total_sessions": 0,
        "in_progress": 0,
        "completed": 0,
        "completion_rate": 0,
    },
    "performance": {
        "debate_throughput": {
            "talent_acquisition_score": 0,
            "workforce_planning_index": 0,
            "strategic_governance_rating": 0,
        },
        "live_feed_activity": 0,
        "enterprise_confidence_curve": [],
        "operational_momentum": 0,
    },
    "simulation": {
        "scenario_decision_paths": [],
    },
    "ai_engines": {
        "standby": True,
        "thinking_loop": False,
    },
}


@router.get("/overview")
async def analytics_overview(db: Session = Depends(get_db)):
    sessions = db.query(DebateSession).order_by(DebateSession.created_at.desc()).all()
    if not sessions:
        return _EMPTY_OVERVIEW

    profiles = []
    for session in sessions:
        args = (
            db.query(Argument)
            .filter(Argument.session_id == session.id)
            .order_by(Argument.round_number, Argument.id)
            .all()
        )
        profiles.append(_compute_session_profile(session, args))

    total = len(sessions)
    in_progress = len([s for s in sessions if s.status == "DEBATING"])
    completed = len([s for s in sessions if s.status == "FINISHED"])

    avg_talent = round(sum(p["performance"]["debate_throughput"]["talent_acquisition_score"] for p in profiles) / total, 2)
    avg_workforce = round(sum(p["performance"]["debate_throughput"]["workforce_planning_index"] for p in profiles) / total, 2)
    avg_governance = round(sum(p["performance"]["debate_throughput"]["strategic_governance_rating"] for p in profiles) / total, 2)
    avg_momentum = round(sum(p["performance"]["operational_momentum"] for p in profiles) / total, 2)
    avg_live_feed = round(sum(p["performance"]["live_feed_activity"] for p in profiles) / total, 2)

    curve_points = max(len(p["performance"]["enterprise_confidence_curve"]) for p in profiles)
    merged_curve = []
    for idx in range(curve_points):
        values = [
            p["performance"]["enterprise_confidence_curve"][idx]
            for p in profiles
            if idx < len(p["performance"]["enterprise_confidence_curve"])
        ]
        merged_curve.append(round(sum(values) / len(values), 2) if values else 0.0)

    latest_paths = profiles[0]["simulation"]["scenario_decision_paths"]

    return {
        "performance_metrics": {
            "total_sessions": total,
            "in_progress": in_progress,
            "completed": completed,
            "completion_rate": int(round((completed / total) * 100)),
        },
        "performance": {
            "debate_throughput": {
                "talent_acquisition_score": avg_talent,
                "workforce_planning_index": avg_workforce,
                "strategic_governance_rating": avg_governance,
            },
            "live_feed_activity": avg_live_feed,
            "enterprise_confidence_curve": merged_curve,
            "operational_momentum": avg_momentum,
        },
        "simulation": {
            "scenario_decision_paths": latest_paths,
        },
        "ai_engines": {
            "standby": total == 0,
            "thinking_loop": any(p["modules"]["ai_thinking_loop_status"] for p in profiles),
        },
    }


@router.get("/session/{session_id}")
async def analytics_for_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DebateSession).filter(DebateSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session introuvable")

    arguments = (
        db.query(Argument)
        .filter(Argument.session_id == session_id)
        .order_by(Argument.round_number, Argument.id)
        .all()
    )

    return _compute_session_profile(session, arguments)
