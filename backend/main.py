from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sessions, debate, reports, auth, analytics
from database import create_tables
from auth import get_current_user

app = FastAPI(title="Agent Débat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    create_tables()

app.include_router(auth.router,     prefix="/api/auth",     tags=["Auth"])
app.include_router(
    sessions.router,
    prefix="/api/sessions",
    tags=["Sessions"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    debate.router,
    prefix="/api/debate",
    tags=["Debate"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    reports.router,
    prefix="/api/reports",
    tags=["Reports"],
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"],
    dependencies=[Depends(get_current_user)],
)

@app.get("/")
def root():
    return {"status": "Agent Débat API is running"}
