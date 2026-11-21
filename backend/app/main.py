from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.redis_client import close_redis, init_redis
from app.db.base import Base
from app.db.init_db import seed_initial_data
from app.db.migrations import run_idempotent_migrations
from app.db.session import SessionLocal, engine
from app import models  # noqa: F401
from sqlalchemy import text

settings = get_settings()

app = FastAPI(title=settings.project_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    if settings.environment.lower() == "production":
        origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
        if len(settings.secret_key) < 32 or settings.secret_key.startswith("development-only"):
            raise RuntimeError("SECRET_KEY de produção deve ter pelo menos 32 caracteres aleatórios")
        if not settings.super_admin_email or len(settings.super_admin_password) < 12:
            raise RuntimeError("Configure SUPER_ADMIN_EMAIL e uma SUPER_ADMIN_PASSWORD forte")
        if not origins or "*" in origins:
            raise RuntimeError("Configure CORS_ORIGINS com os domínios explícitos do frontend")
    run_idempotent_migrations(engine)
    Base.metadata.create_all(bind=engine)
    try:
        init_redis()
    except Exception:
        # Redis is optional at startup; API can still run without cache.
        pass
    with SessionLocal() as db:
        seed_initial_data(db)


@app.on_event("shutdown")
def shutdown() -> None:
    close_redis()


@app.get("/health")
def health() -> dict:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Banco de dados indisponível") from exc
    return {"status": "ok", "service": settings.project_name}


app.include_router(api_router, prefix=settings.api_v1_prefix)
