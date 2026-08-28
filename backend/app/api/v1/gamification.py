from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.gamification import XPTransaction
from app.schemas.gamification import (
    AchievementResponse,
    GamificationOverviewResponse,
    XPTransactionResponse,
)
from app.services.xp_service import XPService
from app.services.streak_service import StreakService
from app.services.achievement_service import AchievementService

router = APIRouter()

@router.get("/overview", response_model=GamificationOverviewResponse)
async def get_gamification_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    level_status = await XPService.get_level_status(db, current_user.id)
    cur_s, long_s, freezes = await StreakService.get_overall_user_streak(db, current_user.id)
    achievements = await AchievementService.get_user_achievements(db, current_user.id)

    stmt_tx = select(XPTransaction).where(
        XPTransaction.user_id == current_user.id
    ).order_by(XPTransaction.created_at.desc()).limit(15)
    txs = (await db.execute(stmt_tx)).scalars().all()

    return GamificationOverviewResponse(
        level=level_status,
        streaks={
            "current_streak": cur_s,
            "longest_streak": long_s,
            "freezes_available": freezes,
        },
        achievements=achievements,
        recent_xp=[XPTransactionResponse.model_validate(t) for t in txs],
    )

@router.get("/achievements", response_model=List[AchievementResponse])
async def list_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AchievementService.get_user_achievements(db, current_user.id)
