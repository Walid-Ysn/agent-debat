from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, Float, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum, os
from pathlib import Path

try:
    from dotenv import load_dotenv
    project_root = Path(__file__).resolve().parents[1]
    load_dotenv(project_root / ".env")
except Exception:
    # Keep running even if python-dotenv is unavailable.
    pass

def _resolve_database_url() -> str:
    # Prefer an explicit Supabase URL, then generic DATABASE_URL, then local SQLite.
    raw_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL") or "sqlite:///./agent_debat.db"

    # Some providers still expose postgres://, but SQLAlchemy expects postgresql://
    if raw_url.startswith("postgres://"):
        raw_url = "postgresql://" + raw_url[len("postgres://"):]

    # Common copy/paste issue from docs: password left wrapped in []
    if ":[" in raw_url and "]@" in raw_url:
        raw_url = raw_url.replace(":[", ":", 1).replace("]@", "@", 1)

    # Use psycopg3 driver explicitly for modern Python compatibility.
    if raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+psycopg://"):
        raw_url = "postgresql+psycopg://" + raw_url[len("postgresql://"):]

    return raw_url


DATABASE_URL = _resolve_database_url()

engine_kwargs = {
    "pool_pre_ping": True,
}

if "sqlite" in DATABASE_URL:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif DATABASE_URL.startswith("postgresql") and "sslmode=" not in DATABASE_URL:
    # Supabase requires SSL for direct Postgres connections.
    engine_kwargs["connect_args"] = {"sslmode": "require"}

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── Models ────────────────────────────────────────────────────────────────────

class AgentType(str, enum.Enum):
    POUR    = "POUR"
    CONTRE  = "CONTRE"
    ARBITRE = "ARBITRE"

class SessionStatus(str, enum.Enum):
    PENDING   = "PENDING"
    DEBATING  = "DEBATING"
    FINISHED  = "FINISHED"

class DebateSession(Base):
    __tablename__ = "sessions"
    id          = Column(String, primary_key=True)
    title       = Column(String, nullable=False)
    decision    = Column(Text,   nullable=False)
    context     = Column(Text,   default="")
    domain      = Column(String, default="RH")   # RH | STRATEGIE
    status      = Column(String, default=SessionStatus.PENDING)
    created_at  = Column(DateTime, default=datetime.utcnow)

class Argument(Base):
    __tablename__ = "arguments"
    id           = Column(Integer, primary_key=True, autoincrement=True)
    session_id   = Column(String, nullable=False)
    agent_type   = Column(String, nullable=False)   # POUR | CONTRE | ARBITRE
    round_number = Column(Integer, nullable=False)
    content      = Column(Text,   nullable=False)
    score        = Column(Float,  default=0.0)
    created_at   = Column(DateTime, default=datetime.utcnow)

class Report(Base):
    __tablename__ = "reports"
    id                = Column(Integer, primary_key=True, autoincrement=True)
    session_id        = Column(String, nullable=False, unique=True)
    recommendation    = Column(Text)
    score_pour        = Column(Float, default=0.0)
    score_contre      = Column(Float, default=0.0)
    confidence_level  = Column(Float, default=0.0)
    risk_notes        = Column(Text, default="")
    created_at        = Column(DateTime, default=datetime.utcnow)

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
