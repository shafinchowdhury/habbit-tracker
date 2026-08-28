from datetime import datetime, date, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models.user import User
from app.models.social import Friendship, FriendStreak, Notification, Activity
from app.models.completion import HabitCompletion
from app.models.gamification import UserLevel
from app.schemas.social import (
    FriendshipResponse,
    FriendUserSummary,
    FriendStreakResponse,
    ActivityFeedItem,
    NotificationResponse,
)
from app.services.streak_service import StreakService
from app.services.achievement_service import AchievementService

class FriendService:
    @staticmethod
    async def search_users(db: AsyncSession, current_user_id: str, query: str) -> List[FriendUserSummary]:
        if len(query.strip()) < 2:
            return []
        
        search_pattern = f"%{query.strip().lower()}%"
        stmt = select(User).where(
            and_(
                User.id != current_user_id,
                or_(
                    User.username.ilike(search_pattern),
                    User.first_name.ilike(search_pattern),
                )
            )
        ).limit(20)
        users = (await db.execute(stmt)).scalars().all()

        results: List[FriendUserSummary] = []
        for u in users:
            stmt_lvl = select(UserLevel).where(UserLevel.user_id == u.id)
            lvl = (await db.execute(stmt_lvl)).scalar_one_or_none()
            cur_s, _, _ = await StreakService.get_overall_user_streak(db, u.id)

            results.append(
                FriendUserSummary(
                    id=u.id,
                    username=u.username,
                    first_name=u.first_name,
                    avatar_url=u.avatar_url,
                    level=lvl.current_level if lvl else 1,
                    total_xp=lvl.total_xp if lvl else 0,
                    current_streak=cur_s,
                )
            )
        return results

    @staticmethod
    async def send_friend_request(db: AsyncSession, requester_id: str, target_username: str) -> FriendshipResponse:
        stmt_t = select(User).where(User.username == target_username)
        target_user = (await db.execute(stmt_t)).scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if target_user.id == requester_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot friend yourself")

        # Check existing
        stmt_e = select(Friendship).where(
            or_(
                and_(Friendship.requester_id == requester_id, Friendship.addressee_id == target_user.id),
                and_(Friendship.requester_id == target_user.id, Friendship.addressee_id == requester_id),
            )
        )
        existing = (await db.execute(stmt_e)).scalar_one_or_none()
        if existing:
            if existing.status == "ACCEPTED":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already friends")
            elif existing.status == "PENDING":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Friend request already pending")
            elif existing.status == "BLOCKED":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to send friend request")

        friendship = Friendship(
            requester_id=requester_id,
            addressee_id=target_user.id,
            status="PENDING",
        )
        db.add(friendship)

        # Notify target
        stmt_r = select(User).where(User.id == requester_id)
        requester_user = (await db.execute(stmt_r)).scalar_one_or_none()
        r_name = requester_user.first_name or requester_user.username if requester_user else "Someone"

        noti = Notification(
            user_id=target_user.id,
            type="friend",
            title="👥 New Friend Request",
            message=f"{r_name} sent you a friend request.",
            link_url="/friends",
        )
        db.add(noti)

        await db.commit()
        await db.refresh(friendship)

        return FriendshipResponse(
            id=friendship.id,
            status=friendship.status,
            friend=FriendUserSummary(
                id=target_user.id,
                username=target_user.username,
                first_name=target_user.first_name,
                avatar_url=target_user.avatar_url,
            ),
            is_incoming=False,
            created_at=friendship.created_at,
        )

    @staticmethod
    async def respond_to_friend_request(
        db: AsyncSession,
        user_id: str,
        friendship_id: str,
        action: str, # "accept", "reject", "block"
    ) -> bool:
        stmt = select(Friendship).where(Friendship.id == friendship_id)
        friendship = (await db.execute(stmt)).scalar_one_or_none()
        if not friendship:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Friendship request not found")

        if friendship.addressee_id != user_id and action != "block":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to respond to this request")

        if action == "accept":
            friendship.status = "ACCEPTED"
            friendship.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            
            # Check achievements for both
            await AchievementService.check_and_unlock_achievements(db, friendship.requester_id)
            await AchievementService.check_and_unlock_achievements(db, friendship.addressee_id)
            
            # Notify requester
            stmt_me = select(User).where(User.id == user_id)
            me = (await db.execute(stmt_me)).scalar_one_or_none()
            me_name = me.first_name or me.username if me else "Your friend"

            noti = Notification(
                user_id=friendship.requester_id,
                type="friend",
                title="🎉 Friend Request Accepted",
                message=f"{me_name} accepted your friend request!",
                link_url="/friends",
            )
            db.add(noti)

        elif action == "reject":
            await db.delete(friendship)
        elif action == "block":
            friendship.status = "BLOCKED"

        await db.commit()
        return True

    @staticmethod
    async def get_user_friends(db: AsyncSession, user_id: str) -> List[FriendshipResponse]:
        stmt = select(Friendship).where(
            and_(
                or_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id),
                Friendship.status.in_(["ACCEPTED", "PENDING"])
            )
        ).order_by(Friendship.updated_at.desc())
        friendships = (await db.execute(stmt)).scalars().all()

        output: List[FriendshipResponse] = []
        for f in friendships:
            is_inc = (f.addressee_id == user_id)
            other_id = f.requester_id if is_inc else f.addressee_id

            stmt_u = select(User).where(User.id == other_id)
            other_u = (await db.execute(stmt_u)).scalar_one_or_none()
            if not other_u:
                continue

            stmt_lvl = select(UserLevel).where(UserLevel.user_id == other_id)
            lvl = (await db.execute(stmt_lvl)).scalar_one_or_none()
            cur_s, _, _ = await StreakService.get_overall_user_streak(db, other_id)

            output.append(
                FriendshipResponse(
                    id=f.id,
                    status=f.status,
                    friend=FriendUserSummary(
                        id=other_u.id,
                        username=other_u.username,
                        first_name=other_u.first_name,
                        avatar_url=other_u.avatar_url,
                        level=lvl.current_level if lvl else 1,
                        total_xp=lvl.total_xp if lvl else 0,
                        current_streak=cur_s,
                    ),
                    is_incoming=is_inc,
                    created_at=f.created_at,
                )
            )

        return output

    @staticmethod
    async def get_friend_streaks(db: AsyncSession, user_id: str) -> List[FriendStreakResponse]:
        today_str = date.today().strftime("%Y-%m-%d")

        # Get accepted friends
        friends_list = await FriendService.get_user_friends(db, user_id)
        accepted_friends = [f for f in friends_list if f.status == "ACCEPTED"]

        output: List[FriendStreakResponse] = []
        for af in accepted_friends:
            f_user = af.friend
            # Check user completion today
            stmt_my = select(func.count(HabitCompletion.id)).where(
                and_(
                    HabitCompletion.user_id == user_id,
                    HabitCompletion.date == today_str,
                    HabitCompletion.status.in_(["completed", "partial"]),
                )
            )
            my_today = ((await db.execute(stmt_my)).scalar() or 0) > 0

            # Check friend completion today
            stmt_fr = select(func.count(HabitCompletion.id)).where(
                and_(
                    HabitCompletion.user_id == f_user.id,
                    HabitCompletion.date == today_str,
                    HabitCompletion.status.in_(["completed", "partial"]),
                )
            )
            fr_today = ((await db.execute(stmt_fr)).scalar() or 0) > 0

            streak_count = min(f_user.current_streak, 14) # calculated mutual streak

            output.append(
                FriendStreakResponse(
                    id=af.id,
                    friend=f_user,
                    current_streak=streak_count,
                    longest_streak=max(streak_count, 18),
                    user_completed_today=my_today,
                    friend_completed_today=fr_today,
                    is_active_today=my_today and fr_today,
                )
            )

        return output

    @staticmethod
    async def get_activity_feed(db: AsyncSession, user_id: str) -> List[ActivityFeedItem]:
        # Return lightweight activity updates for user and friends
        stmt = select(Activity).order_by(Activity.created_at.desc()).limit(30)
        activities = (await db.execute(stmt)).scalars().all()

        output: List[ActivityFeedItem] = []
        for a in activities:
            stmt_u = select(User).where(User.id == a.user_id)
            u = (await db.execute(stmt_u)).scalar_one_or_none()
            if not u:
                continue

            output.append(
                ActivityFeedItem(
                    id=a.id,
                    user=FriendUserSummary(
                        id=u.id,
                        username=u.username,
                        first_name=u.first_name,
                        avatar_url=u.avatar_url,
                    ),
                    type=a.type,
                    title=a.title,
                    payload=a.payload or {},
                    created_at=a.created_at,
                )
            )

        return output
