from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse
from app.schemas.completion import HabitCompletionCreate, HabitCellToggle
from app.services.streak_service import StreakService
from app.services.xp_service import XPService
from app.services.achievement_service import AchievementService

class HabitService:
    @staticmethod
    async def create_habit(db: AsyncSession, user_id: str, data: HabitCreate) -> HabitResponse:
        from datetime import timedelta
        habit_dict = data.model_dump()
        
        # Ensure all incoming datetimes are naive UTC for Postgres asyncpg
        for dt_field in ["start_date", "end_date", "pause_until"]:
            if habit_dict.get(dt_field) and isinstance(habit_dict[dt_field], datetime):
                habit_dict[dt_field] = habit_dict[dt_field].replace(tzinfo=None)
                
        if habit_dict.get("target_days") and not habit_dict.get("end_date"):
            start_d = habit_dict.get("start_date") or datetime.now(timezone.utc).replace(tzinfo=None)
            habit_dict["end_date"] = start_d + timedelta(days=habit_dict["target_days"])
        elif habit_dict.get("end_date") and not habit_dict.get("target_days"):
            start_d = habit_dict.get("start_date") or datetime.now(timezone.utc).replace(tzinfo=None)
            diff = (habit_dict["end_date"].date() - start_d.date()).days
            habit_dict["target_days"] = max(1, diff)

        habit = Habit(
            user_id=user_id,
            **habit_dict,
        )
        db.add(habit)
        await db.commit()
        await db.refresh(habit)
        return HabitResponse.model_validate(habit)

    @staticmethod
    async def get_user_habits(
        db: AsyncSession,
        user_id: str,
        include_archived: bool = False,
    ) -> List[HabitResponse]:
        conditions = [Habit.user_id == user_id]
        if not include_archived:
            conditions.append(Habit.is_archived.is_(False))

        stmt = select(Habit).where(and_(*conditions)).order_by(Habit.order_index.asc(), Habit.created_at.asc())
        res = await db.execute(stmt)
        habits = res.scalars().all()

        output: List[HabitResponse] = []
        for h in habits:
            cur_s, long_s = await StreakService.recalculate_habit_streak(db, user_id, h.id)
            
            # calculate completion rate (30 days)
            start_30 = date.today().replace(day=1) # or 30 days
            start_str = start_30.strftime("%Y-%m-%d")
            stmt_c = select(func.count(HabitCompletion.id)).where(
                and_(
                    HabitCompletion.habit_id == h.id,
                    HabitCompletion.status.in_(["completed", "partial"]),
                    HabitCompletion.date >= start_str,
                )
            )
            completed_c = (await db.execute(stmt_c)).scalar() or 0
            
            resp = HabitResponse(
                id=h.id,
                user_id=h.user_id,
                name=h.name,
                description=h.description,
                default_duration_minutes=h.default_duration_minutes,
                icon=h.icon or "🎯",
                category=h.category,
                color=h.color,
                measurement_type=h.measurement_type,
                target_value=h.target_value,
                unit=h.unit,
                frequency_type=h.frequency_type,
                frequency_data=h.frequency_data or {},
                is_paused=h.is_paused,
                pause_until=h.pause_until,
                is_archived=h.is_archived,
                visibility=h.visibility,
                start_date=h.start_date,
                end_date=h.end_date,
                target_days=h.target_days,
                order_index=h.order_index,
                created_at=h.created_at,
                updated_at=h.updated_at,
                current_streak=cur_s,
                longest_streak=long_s,
                completion_rate=min(100.0, float(completed_c * 5.0)), # approx or accurate
            )
            output.append(resp)

        return output

    @staticmethod
    async def update_habit(
        db: AsyncSession,
        user_id: str,
        habit_id: str,
        data: HabitUpdate,
    ) -> HabitResponse:
        from datetime import timedelta
        stmt = select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == user_id))
        res = await db.execute(stmt)
        habit = res.scalar_one_or_none()
        if not habit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

        update_data = data.model_dump(exclude_unset=True)
        for dt_field in ["start_date", "end_date", "pause_until"]:
            if update_data.get(dt_field) and isinstance(update_data[dt_field], datetime):
                update_data[dt_field] = update_data[dt_field].replace(tzinfo=None)
                
        if "target_days" in update_data:
            t_days = update_data["target_days"]
            if t_days is not None and t_days > 0:
                start_d = update_data.get("start_date") or habit.start_date or datetime.now(timezone.utc).replace(tzinfo=None)
                if "end_date" not in update_data:
                    update_data["end_date"] = start_d + timedelta(days=t_days)
            else:
                if "end_date" not in update_data:
                    update_data["end_date"] = None

        for key, value in update_data.items():
            setattr(habit, key, value)

        habit.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        await db.refresh(habit)
        return HabitResponse.model_validate(habit)

    @staticmethod
    async def delete_habit(db: AsyncSession, user_id: str, habit_id: str) -> bool:
        stmt = select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == user_id))
        res = await db.execute(stmt)
        habit = res.scalar_one_or_none()
        if not habit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

        await db.delete(habit)
        await db.commit()
        return True

    @staticmethod
    async def clear_all_habits(db: AsyncSession, user_id: str) -> int:
        """
        Deletes all active habits for the user.
        """
        stmt = select(Habit).where(and_(Habit.user_id == user_id, Habit.is_archived.is_(False)))
        res = await db.execute(stmt)
        habits = res.scalars().all()
        count = len(habits)
        for h in habits:
            await db.delete(h)
        await db.commit()
        return count

    @staticmethod
    async def clear_all_archived_habits(db: AsyncSession, user_id: str) -> int:
        """
        Deletes all archived habits for the user.
        """
        stmt = select(Habit).where(and_(Habit.user_id == user_id, Habit.is_archived.is_(True)))
        res = await db.execute(stmt)
        habits = res.scalars().all()
        count = len(habits)
        for h in habits:
            await db.delete(h)
        await db.commit()
        return count

    @staticmethod
    async def clear_all_completions(db: AsyncSession, user_id: str) -> int:
        """
        Deletes all completions (ticks) for the user and resets streak stats for testing.
        """
        from app.models.gamification import Streak
        stmt = select(HabitCompletion).where(HabitCompletion.user_id == user_id)
        res = await db.execute(stmt)
        completions = res.scalars().all()
        count = len(completions)
        for c in completions:
            await db.delete(c)

        # Reset all streak records for this user
        stmt_s = select(Streak).where(Streak.user_id == user_id)
        res_s = await db.execute(stmt_s)
        streaks = res_s.scalars().all()
        for s in streaks:
            s.current_streak = 0
            s.longest_streak = 0
            s.last_completed_date = None

        await db.commit()
        return count

    @staticmethod
    async def toggle_completion(
        db: AsyncSession,
        user_id: str,
        data: HabitCellToggle,
    ) -> dict:
        """
        Toggles or updates a habit cell completion state.
        Handles XP awarding and streak updates.
        """
        stmt_h = select(Habit).where(and_(Habit.id == data.habit_id, Habit.user_id == user_id))
        res_h = await db.execute(stmt_h)
        habit = res_h.scalar_one_or_none()
        if not habit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

        stmt_c = select(HabitCompletion).where(
            and_(HabitCompletion.habit_id == data.habit_id, HabitCompletion.date == data.date)
        )
        res_c = await db.execute(stmt_c)
        completion = res_c.scalar_one_or_none()

        xp_earned = 0
        status_action = data.status or "completed"

        if status_action == "uncomplete":
            if completion:
                await db.delete(completion)
                await db.commit()
            # Recalculate streak
            cur_s, _ = await StreakService.recalculate_habit_streak(db, user_id, habit.id)
            return {"status": "uncompleted", "habit_id": habit.id, "date": data.date, "xp_earned": 0, "current_streak": cur_s}

        if not completion:
            # Default duration: if measurement is duration, set minutes; else 15 mins default for logging
            duration = data.duration_minutes
            if duration is None:
                if habit.measurement_type == "duration":
                    duration = habit.target_value * 60.0
                elif habit.category == "Coding":
                    duration = 60.0
                elif habit.category == "Reading":
                    duration = 30.0
                else:
                    duration = 15.0

            completion = HabitCompletion(
                habit_id=habit.id,
                user_id=user_id,
                date=data.date,
                status=status_action,
                target_value=habit.target_value,
                actual_value=data.actual_value if data.actual_value is not None else habit.target_value,
                duration_minutes=duration,
                note=data.note,
            )
            db.add(completion)

            # Award XP on successful completion (+20 XP standard)
            if status_action in ("completed", "partial"):
                xp_earned = 20 if status_action == "completed" else 10
                await XPService.award_xp(
                    db,
                    user_id=user_id,
                    amount=xp_earned,
                    source="habit_completion",
                    reference_id=habit.id,
                    description=f"Completed {habit.name}",
                )
        else:
            # Update existing
            was_completed = completion.status in ("completed", "partial")
            is_now_completed = status_action in ("completed", "partial")
            
            completion.status = status_action
            if data.actual_value is not None:
                completion.actual_value = data.actual_value
            if data.duration_minutes is not None:
                completion.duration_minutes = data.duration_minutes
            if data.note is not None:
                completion.note = data.note

            if not was_completed and is_now_completed:
                xp_earned = 20 if status_action == "completed" else 10
                await XPService.award_xp(
                    db,
                    user_id=user_id,
                    amount=xp_earned,
                    source="habit_completion",
                    reference_id=habit.id,
                    description=f"Completed {habit.name}",
                )

        await db.commit()
        await db.refresh(completion)

        # Recalculate streak
        cur_s, long_s = await StreakService.recalculate_habit_streak(db, user_id, habit.id)
        
        # Check and unlock achievements
        await AchievementService.check_and_unlock_achievements(db, user_id)

        return {
            "status": completion.status,
            "habit_id": habit.id,
            "date": completion.date,
            "actual_value": completion.actual_value,
            "duration_minutes": completion.duration_minutes,
            "note": completion.note,
            "xp_earned": xp_earned,
            "current_streak": cur_s,
            "longest_streak": long_s,
        }
