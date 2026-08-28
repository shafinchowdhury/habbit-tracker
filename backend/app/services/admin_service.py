from typing import List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from app.models.user import User, UserSettings
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.models.gamification import Streak, UserLevel, XPTransaction
from app.models.challenge import Challenge
from app.models.social import Notification
from app.schemas.admin import AdminUserSummary, AdminStats, AdminUserDetail
from app.services.habit_service import HabitService

class AdminService:
    @staticmethod
    async def get_all_users(db: AsyncSession) -> List[AdminUserSummary]:
        stmt = select(User).order_by(User.created_at.desc())
        res = await db.execute(stmt)
        users = res.scalars().all()

        output: List[AdminUserSummary] = []
        for u in users:
            # Habits counts
            stmt_habits = select(
                func.count(Habit.id),
                func.sum(case((Habit.is_archived.is_(False), 1), else_=0))
            ).where(Habit.user_id == u.id)
            res_habits = await db.execute(stmt_habits)
            total_h, active_h = res_habits.one()
            total_h = total_h or 0
            active_h = active_h or 0

            # Completions count
            stmt_comps = select(func.count(HabitCompletion.id)).where(HabitCompletion.user_id == u.id)
            total_c = (await db.execute(stmt_comps)).scalar() or 0

            # Level & XP
            stmt_lvl = select(UserLevel).where(UserLevel.user_id == u.id)
            lvl_obj = (await db.execute(stmt_lvl)).scalar_one_or_none()
            lvl = lvl_obj.current_level if lvl_obj else 1
            xp = lvl_obj.total_xp if lvl_obj else 0

            # Streaks
            stmt_s = select(Streak).where(Streak.user_id == u.id)
            streaks = (await db.execute(stmt_s)).scalars().all()
            cur_streak = max([s.current_streak for s in streaks], default=0)
            long_streak = max([s.longest_streak for s in streaks], default=0)

            # Settings
            stmt_set = select(UserSettings).where(UserSettings.user_id == u.id)
            set_obj = (await db.execute(stmt_set)).scalar_one_or_none()
            settings_dict = {
                "theme": set_obj.theme if set_obj else "clarity",
                "reminder_enabled": set_obj.reminder_enabled if set_obj else False,
                "daily_reminder_time": set_obj.daily_reminder_time if set_obj else "20:00",
                "profile_visibility": set_obj.profile_visibility if set_obj else "PUBLIC",
            } if set_obj else None

            output.append(
                AdminUserSummary(
                    id=u.id,
                    username=u.username,
                    email=u.email,
                    first_name=u.first_name,
                    avatar_url=u.avatar_url,
                    timezone=u.timezone or "UTC",
                    is_active=bool(u.is_active),
                    is_superuser=bool(u.is_superuser),
                    created_at=u.created_at,
                    total_habits=total_h,
                    active_habits=active_h,
                    total_completions=total_c,
                    level=lvl,
                    current_xp=xp,
                    current_streak=cur_streak,
                    longest_streak=long_streak,
                    settings=settings_dict,
                )
            )

        return output

    @staticmethod
    async def get_user_detail(db: AsyncSession, target_user_id: str) -> Optional[AdminUserDetail]:
        stmt = select(User).where(User.id == target_user_id)
        user = (await db.execute(stmt)).scalar_one_or_none()
        if not user:
            return None

        # Get summary for user
        all_users = await AdminService.get_all_users(db)
        user_summary = next((u for u in all_users if u.id == target_user_id), None)
        if not user_summary:
            return None

        # Get user habits
        habits = await HabitService.get_user_habits(db, target_user_id, include_archived=True)

        # Get recent completions
        stmt_comps = select(HabitCompletion).where(HabitCompletion.user_id == target_user_id).order_by(HabitCompletion.date.desc()).limit(15)
        comps = (await db.execute(stmt_comps)).scalars().all()
        recent_activity = [
            {
                "id": c.id,
                "date": c.date,
                "status": c.status,
                "duration_minutes": c.duration_minutes,
                "note": c.note,
                "habit_id": c.habit_id,
            }
            for c in comps
        ]

        return AdminUserDetail(
            user=user_summary,
            habits=habits,
            recent_activity=recent_activity,
        )

    @staticmethod
    async def get_stats(db: AsyncSession) -> AdminStats:
        # Total users
        total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0

        # Total active habits
        total_active_habits = (await db.execute(select(func.count(Habit.id)).where(Habit.is_archived.is_(False)))).scalar() or 0

        # Total completions
        total_completions = (await db.execute(select(func.count(HabitCompletion.id)))).scalar() or 0

        # Total XP
        total_xp = (await db.execute(select(func.sum(UserLevel.total_xp)))).scalar() or 0

        # Total challenges
        total_challenges = (await db.execute(select(func.count(Challenge.id)))).scalar() or 0

        # Active users in last 7 days (users who completed a habit in last 7 days)
        seven_days_ago = (date.today() - timedelta(days=7)).strftime("%Y-%m-%d")
        stmt_act = select(func.count(func.distinct(HabitCompletion.user_id))).where(HabitCompletion.date >= seven_days_ago)
        active_users_7d = (await db.execute(stmt_act)).scalar() or 0

        return AdminStats(
            total_users=total_users,
            total_active_habits=total_active_habits,
            total_completions=total_completions,
            total_xp=int(total_xp),
            total_challenges=total_challenges,
            active_users_last_7d=active_users_7d,
        )

    @staticmethod
    async def update_user_role(
        db: AsyncSession,
        target_user_id: str,
        is_superuser: bool,
        admin_username: str = "Admin",
    ) -> Optional[AdminUserSummary]:
        stmt = select(User).where(User.id == target_user_id)
        user = (await db.execute(stmt)).scalar_one_or_none()
        if not user:
            return None

        user.is_superuser = is_superuser

        # Send notification to user about their role update
        if is_superuser:
            notif = Notification(
                user_id=target_user_id,
                type="admin",
                title="👑 You are now an Admin!",
                message=f"Administrator @{admin_username} has granted you Admin privileges. You now have full access to the Admin Portal.",
                link_url="/admin",
            )
            db.add(notif)
        else:
            notif = Notification(
                user_id=target_user_id,
                type="info",
                title="Role Updated",
                message="Your account role has been updated to Member.",
                link_url="/dashboard",
            )
            db.add(notif)

        await db.commit()
        await db.refresh(user)

        # Return updated summary
        all_users = await AdminService.get_all_users(db)
        return next((u for u in all_users if u.id == target_user_id), None)

    @staticmethod
    async def delete_user(db: AsyncSession, target_user_id: str, admin_id: str) -> bool:
        if target_user_id == admin_id:
            raise ValueError("You cannot delete your own admin account.")

        stmt = select(User).where(User.id == target_user_id)
        user = (await db.execute(stmt)).scalar_one_or_none()
        if not user:
            return False

        await db.delete(user)
        await db.commit()
        return True
