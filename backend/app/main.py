from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import (
    auth,
    habits,
    completions,
    dashboard,
    analytics,
    gamification,
    friends,
    challenges,
    user_settings,
    admin,
)
from sqlalchemy import text
from app.services.achievement_service import AchievementService
from app.core.database import AsyncSessionLocal

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure target_days column exists in SQLite / Postgres
        try:
            if settings.DATABASE_URL.startswith("postgresql"):
                await conn.execute(text("ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_days INTEGER"))
            else:
                await conn.execute(text("ALTER TABLE habits ADD COLUMN target_days INTEGER"))
        except Exception:
            pass
        
    # Seed default achievements if needed
    async with AsyncSessionLocal() as session:
        await AchievementService.seed_default_achievements(session)
        
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(habits.router, prefix=f"{settings.API_V1_STR}/habits", tags=["Habits"])
app.include_router(completions.router, prefix=f"{settings.API_V1_STR}/completions", tags=["Completions"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(gamification.router, prefix=f"{settings.API_V1_STR}/gamification", tags=["Gamification"])
app.include_router(friends.router, prefix=f"{settings.API_V1_STR}/friends", tags=["Friends"])
app.include_router(challenges.router, prefix=f"{settings.API_V1_STR}/challenges", tags=["Challenges"])
app.include_router(user_settings.router, prefix=f"{settings.API_V1_STR}/settings", tags=["User Settings"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin Portal"])

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "healthy",
        "docs": f"{settings.API_V1_STR}/docs",
    }

@app.get("/health")
async def health_check():
    return {"status": "ok"}
