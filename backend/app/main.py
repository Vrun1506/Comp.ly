from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import consultancies, workspaces, github, scans, plans

app = FastAPI(
    title="Comply API",
    description="Infrastructure compliance scanning and remediation platform",
    version="0.1.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(consultancies.router)
app.include_router(workspaces.router)
app.include_router(github.router)
app.include_router(scans.router)
app.include_router(plans.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "comply-api"}
