import math
from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.gamification import UserLevel, XPTransaction
from app.schemas.gamification import LevelStatusResponse

LEVEL_TITLES = [
    (1, "Novice Explorer"),
    (3, "Routine Builder"),
    (5, "Habit Artisan"),
    (8, "Consistency Master"),
    (12, "Streak Champion"),
    (15, "Focus Grandmaster"),
    (20, "Legendary Achiever"),
]

def calculate_level_from_xp(total_xp: int) -> Tuple[int, int, int]:
    """
    Returns (current_level, xp_in_current_level, xp_needed_for_next_level)
    Deterministic formula:
    Base XP for level L = (L-1)*L/2 * 100
    Level 1: 0 XP
    Level 2: 100 XP
    Level 3: 300 XP
    Level 4: 600 XP
    """
    if total_xp <= 0:
        return 1, 0, 100
    
    # Quadratic formula solve for L
    level = math.floor((1 + math.sqrt(1 + 8 * (total_xp / 100))) / 2)
    if level < 1:
        level = 1
        
    xp_for_current = int((level - 1) * level / 2 * 100)
    xp_for_next = int(level * (level + 1) / 2 * 100)
    
    xp_in_level = total_xp - xp_for_current
    xp_needed_in_level = xp_for_next - xp_for_current
    
    return level, xp_in_level, xp_needed_in_level

def get_level_title(level: int) -> str:
    title = "Novice Explorer"
    for threshold, name in LEVEL_TITLES:
        if level >= threshold:
            title = name
    return title

class XPService:
    @staticmethod
    async def get_or_create_level(db: AsyncSession, user_id: str) -> UserLevel:
        stmt = select(UserLevel).where(UserLevel.user_id == user_id)
        res = await db.execute(stmt)
        level_obj = res.scalar_one_or_none()
        if not level_obj:
            level_obj = UserLevel(user_id=user_id, total_xp=0, current_level=1)
            db.add(level_obj)
            await db.commit()
            await db.refresh(level_obj)
        return level_obj

    @staticmethod
    async def award_xp(
        db: AsyncSession,
        user_id: str,
        amount: int,
        source: str,
        reference_id: str = None,
        description: str = None,
    ) -> Tuple[UserLevel, bool]:
        """
        Awards XP and records an XP transaction. Returns (UserLevel, did_level_up).
        """
        if amount <= 0:
            level_obj = await XPService.get_or_create_level(db, user_id)
            return level_obj, False

        # Record transaction
        tx = XPTransaction(
            user_id=user_id,
            amount=amount,
            source=source,
            reference_id=reference_id,
            description=description or f"+{amount} XP from {source}",
        )
        db.add(tx)

        # Update level object
        level_obj = await XPService.get_or_create_level(db, user_id)
        old_level = level_obj.current_level
        level_obj.total_xp += amount
        
        new_level, _, _ = calculate_level_from_xp(level_obj.total_xp)
        level_obj.current_level = new_level
        did_level_up = new_level > old_level

        await db.commit()
        await db.refresh(level_obj)
        return level_obj, did_level_up

    @staticmethod
    async def get_level_status(db: AsyncSession, user_id: str) -> LevelStatusResponse:
        level_obj = await XPService.get_or_create_level(db, user_id)
        level, cur_xp, target_xp = calculate_level_from_xp(level_obj.total_xp)
        progress = (cur_xp / target_xp * 100.0) if target_xp > 0 else 100.0

        return LevelStatusResponse(
            current_level=level,
            total_xp=level_obj.total_xp,
            level_current_xp=cur_xp,
            level_target_xp=target_xp,
            progress_percentage=round(progress, 1),
            title=get_level_title(level),
            next_level_reward=f"Level {level + 1} Badge & Unlock",
        )
