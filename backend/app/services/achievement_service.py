from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.gamification import Achievement, UserAchievement
from app.models.completion import HabitCompletion
from app.models.social import Friendship, Notification
from app.models.challenge import ChallengeParticipant
from app.services.xp_service import XPService
from app.schemas.gamification import AchievementResponse

DEFAULT_ACHIEVEMENTS = [
    {
        "code": "FIRST_STEP",
        "title": "First Step",
        "description": "Complete your very first habit.",
        "icon": "🌱",
        "xp_reward": 50,
        "category": "consistency",
        "tier": "bronze",
        "target_value": 1,
    },
    {
        "code": "ON_FIRE_7",
        "title": "On Fire",
        "description": "Maintain a 7-day habit streak.",
        "icon": "🔥",
        "xp_reward": 100,
        "category": "streaks",
        "tier": "bronze",
        "target_value": 7,
    },
    {
        "code": "UNSTOPPABLE_30",
        "title": "Unstoppable",
        "description": "Reach a legendary 30-day streak.",
        "icon": "⚡",
        "xp_reward": 300,
        "category": "streaks",
        "tier": "silver",
        "target_value": 30,
    },
    {
        "code": "CENTURY_100",
        "title": "Century Club",
        "description": "Log 100 habit completions.",
        "icon": "💯",
        "xp_reward": 250,
        "category": "volume",
        "tier": "silver",
        "target_value": 100,
    },
    {
        "code": "DEDICATED_500",
        "title": "Dedicated Master",
        "description": "Reach 500 total completed habit logs.",
        "icon": "👑",
        "xp_reward": 500,
        "category": "volume",
        "tier": "gold",
        "target_value": 500,
    },
    {
        "code": "CHALLENGER",
        "title": "Challenger",
        "description": "Participate in your first group challenge.",
        "icon": "⚔️",
        "xp_reward": 150,
        "category": "challenges",
        "tier": "bronze",
        "target_value": 1,
    },
    {
        "code": "SOCIAL_BUTTERFLY",
        "title": "Social Circle",
        "description": "Add your first friend on HabitQuest.",
        "icon": "👥",
        "xp_reward": 100,
        "category": "social",
        "tier": "bronze",
        "target_value": 1,
    },
    {
        "code": "FLAWLESS_WEEK",
        "title": "Flawless Week",
        "description": "Complete all scheduled habits for 7 straight days.",
        "icon": "🌟",
        "xp_reward": 200,
        "category": "consistency",
        "tier": "gold",
        "target_value": 7,
    },
]

class AchievementService:
    @staticmethod
    async def seed_default_achievements(db: AsyncSession):
        for item in DEFAULT_ACHIEVEMENTS:
            stmt = select(Achievement).where(Achievement.code == item["code"])
            res = await db.execute(stmt)
            ach = res.scalar_one_or_none()
            if not ach:
                ach = Achievement(**item)
                db.add(ach)
        await db.commit()

    @staticmethod
    async def check_and_unlock_achievements(db: AsyncSession, user_id: str) -> List[Achievement]:
        """
        Evaluates user stats and unlocks any newly earned achievements.
        """
        # Ensure default achievements are seeded
        await AchievementService.seed_default_achievements(db)

        # Get all achievements
        stmt_all = select(Achievement)
        res_all = await db.execute(stmt_all)
        all_achievements = res_all.scalars().all()

        # Get user unlocked achievements
        stmt_user = select(UserAchievement).where(UserAchievement.user_id == user_id)
        res_user = await db.execute(stmt_user)
        user_achs = {ua.achievement_id: ua for ua in res_user.scalars().all()}

        # Stats calculations
        # 1. Total completions count
        stmt_comp = select(func.count(HabitCompletion.id)).where(
            and_(HabitCompletion.user_id == user_id, HabitCompletion.status.in_(["completed", "partial"]))
        )
        total_completions = (await db.execute(stmt_comp)).scalar() or 0

        # 2. Friend count
        stmt_fr = select(func.count(Friendship.id)).where(
            and_(
                (Friendship.requester_id == user_id) | (Friendship.addressee_id == user_id),
                Friendship.status == "ACCEPTED"
            )
        )
        total_friends = (await db.execute(stmt_fr)).scalar() or 0

        # 3. Challenge participation
        stmt_cp = select(func.count(ChallengeParticipant.id)).where(ChallengeParticipant.user_id == user_id)
        total_challenges = (await db.execute(stmt_cp)).scalar() or 0

        newly_unlocked = []

        for ach in all_achievements:
            user_ach = user_achs.get(ach.id)
            if user_ach and user_ach.unlocked_at:
                continue # Already unlocked

            progress = 0
            should_unlock = False

            if ach.code == "FIRST_STEP":
                progress = min(total_completions, 1)
                should_unlock = total_completions >= 1
            elif ach.code == "ON_FIRE_7":
                # Check max streak
                progress = min(total_completions, 7)
                should_unlock = total_completions >= 7
            elif ach.code == "UNSTOPPABLE_30":
                progress = min(total_completions, 30)
                should_unlock = total_completions >= 30
            elif ach.code == "CENTURY_100":
                progress = min(total_completions, 100)
                should_unlock = total_completions >= 100
            elif ach.code == "DEDICATED_500":
                progress = min(total_completions, 500)
                should_unlock = total_completions >= 500
            elif ach.code == "CHALLENGER":
                progress = min(total_challenges, 1)
                should_unlock = total_challenges >= 1
            elif ach.code == "SOCIAL_BUTTERFLY":
                progress = min(total_friends, 1)
                should_unlock = total_friends >= 1
            elif ach.code == "FLAWLESS_WEEK":
                progress = min(total_completions, 7)
                should_unlock = total_completions >= 7

            if not user_ach:
                user_ach = UserAchievement(
                    user_id=user_id,
                    achievement_id=ach.id,
                    progress_value=progress,
                    unlocked_at=datetime.now(timezone.utc).replace(tzinfo=None) if should_unlock else None,
                )
                db.add(user_ach)
            else:
                user_ach.progress_value = progress
                if should_unlock and not user_ach.unlocked_at:
                    user_ach.unlocked_at = datetime.now(timezone.utc).replace(tzinfo=None)

            if should_unlock and (not user_ach or user_ach.unlocked_at is not None):
                # Award XP
                await XPService.award_xp(
                    db,
                    user_id=user_id,
                    amount=ach.xp_reward,
                    source="achievement",
                    reference_id=ach.id,
                    description=f"Unlocked achievement: {ach.title}",
                )
                
                # Add in-app notification
                noti = Notification(
                    user_id=user_id,
                    type="achievement",
                    title=f"🏆 Achievement Unlocked: {ach.title}!",
                    message=f"{ach.description} (+{ach.xp_reward} XP)",
                    link_url="/achievements",
                )
                db.add(noti)
                newly_unlocked.append(ach)

        await db.commit()
        return newly_unlocked

    @staticmethod
    async def get_user_achievements(db: AsyncSession, user_id: str) -> List[AchievementResponse]:
        await AchievementService.seed_default_achievements(db)
        
        stmt = select(Achievement)
        res = await db.execute(stmt)
        all_achs = res.scalars().all()

        stmt_user = select(UserAchievement).where(UserAchievement.user_id == user_id)
        res_user = await db.execute(stmt_user)
        user_map = {ua.achievement_id: ua for ua in res_user.scalars().all()}

        output = []
        for ach in all_achs:
            ua = user_map.get(ach.id)
            is_unlocked = bool(ua and ua.unlocked_at)
            prog = ua.progress_value if ua else 0
            unlocked_d = ua.unlocked_at if ua else None

            output.append(
                AchievementResponse(
                    id=ach.id,
                    code=ach.code,
                    title=ach.title,
                    description=ach.description,
                    icon=ach.icon,
                    xp_reward=ach.xp_reward,
                    category=ach.category,
                    tier=ach.tier,
                    target_value=ach.target_value,
                    is_unlocked=is_unlocked,
                    progress_value=prog,
                    unlocked_at=unlocked_d,
                )
            )
        return output
