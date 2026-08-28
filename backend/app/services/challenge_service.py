from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.challenge import Challenge, ChallengeParticipant
from app.models.user import User
from app.models.gamification import UserLevel
from app.schemas.social import (
    ChallengeCreate,
    ChallengeResponse,
    ChallengeParticipantSummary,
    FriendUserSummary,
)
from app.services.streak_service import StreakService
from app.services.xp_service import XPService
from app.services.achievement_service import AchievementService

class ChallengeService:
    @staticmethod
    async def create_challenge(db: AsyncSession, user_id: str, data: ChallengeCreate) -> ChallengeResponse:
        start_d = datetime.now(timezone.utc).replace(tzinfo=None)
        end_d = start_d + timedelta(days=data.duration_days)

        challenge = Challenge(
            creator_id=user_id,
            title=data.title,
            description=data.description,
            category=data.category,
            target_metric=data.target_metric,
            duration_days=data.duration_days,
            start_date=start_d,
            end_date=end_d,
            visibility=data.visibility,
            xp_reward=data.xp_reward,
        )
        db.add(challenge)
        await db.commit()
        await db.refresh(challenge)

        # Creator automatically joins
        participant = ChallengeParticipant(
            challenge_id=challenge.id,
            user_id=user_id,
            completion_percentage=0.0,
            days_completed=0,
        )
        db.add(participant)
        await db.commit()

        # Check achievements
        await AchievementService.check_and_unlock_achievements(db, user_id)

        return await ChallengeService.get_challenge_by_id(db, challenge.id, user_id)

    @staticmethod
    async def get_challenge_by_id(db: AsyncSession, challenge_id: str, current_user_id: str) -> ChallengeResponse:
        stmt = select(Challenge).where(Challenge.id == challenge_id)
        challenge = (await db.execute(stmt)).scalar_one_or_none()
        if not challenge:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")

        # Creator name
        stmt_c = select(User).where(User.id == challenge.creator_id)
        creator = (await db.execute(stmt_c)).scalar_one_or_none()
        creator_name = creator.first_name or creator.username if creator else "Creator"

        # Participants & Leaderboard
        stmt_p = select(ChallengeParticipant).where(ChallengeParticipant.challenge_id == challenge_id)
        participants = (await db.execute(stmt_p)).scalars().all()

        leaderboard: List[ChallengeParticipantSummary] = []
        is_joined = False
        user_comp_pct = 0.0

        for p in participants:
            if p.user_id == current_user_id:
                is_joined = True
                user_comp_pct = p.completion_percentage

            stmt_u = select(User).where(User.id == p.user_id)
            u = (await db.execute(stmt_u)).scalar_one_or_none()
            if not u:
                continue

            stmt_lvl = select(UserLevel).where(UserLevel.user_id == u.id)
            lvl = (await db.execute(stmt_lvl)).scalar_one_or_none()
            cur_s, _, _ = await StreakService.get_overall_user_streak(db, u.id)

            leaderboard.append(
                ChallengeParticipantSummary(
                    user=FriendUserSummary(
                        id=u.id,
                        username=u.username,
                        first_name=u.first_name,
                        avatar_url=u.avatar_url,
                        level=lvl.current_level if lvl else 1,
                        total_xp=lvl.total_xp if lvl else 0,
                        current_streak=cur_s,
                    ),
                    completion_percentage=p.completion_percentage,
                    days_completed=p.days_completed,
                    is_completed=p.is_completed,
                )
            )

        leaderboard.sort(key=lambda x: x.completion_percentage, reverse=True)

        return ChallengeResponse(
            id=challenge.id,
            creator_id=challenge.creator_id,
            creator_name=creator_name,
            title=challenge.title,
            description=challenge.description,
            category=challenge.category,
            target_metric=challenge.target_metric,
            duration_days=challenge.duration_days,
            start_date=challenge.start_date,
            end_date=challenge.end_date,
            max_participants=challenge.max_participants,
            visibility=challenge.visibility,
            xp_reward=challenge.xp_reward,
            is_joined=is_joined,
            user_completion_percentage=user_comp_pct,
            participants_count=len(participants),
            leaderboard=leaderboard,
            created_at=challenge.created_at,
        )

    @staticmethod
    async def list_challenges(db: AsyncSession, current_user_id: str) -> List[ChallengeResponse]:
        stmt = select(Challenge).order_by(Challenge.created_at.desc())
        challenges = (await db.execute(stmt)).scalars().all()

        output: List[ChallengeResponse] = []
        for c in challenges:
            c_resp = await ChallengeService.get_challenge_by_id(db, c.id, current_user_id)
            output.append(c_resp)

        return output

    @staticmethod
    async def join_challenge(db: AsyncSession, challenge_id: str, user_id: str) -> ChallengeResponse:
        stmt = select(ChallengeParticipant).where(
            and_(ChallengeParticipant.challenge_id == challenge_id, ChallengeParticipant.user_id == user_id)
        )
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already joined this challenge")

        part = ChallengeParticipant(
            challenge_id=challenge_id,
            user_id=user_id,
            completion_percentage=0.0,
            days_completed=0,
        )
        db.add(part)
        await db.commit()

        await AchievementService.check_and_unlock_achievements(db, user_id)
        return await ChallengeService.get_challenge_by_id(db, challenge_id, user_id)
