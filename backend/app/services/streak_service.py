from datetime import datetime, date, timedelta
from typing import List, Optional, Tuple, Dict, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.models.gamification import Streak, StreakFreeze

class StreakService:
    @staticmethod
    def is_habit_scheduled_on_date(habit: Habit, check_date: date) -> bool:
        """
        Determines if a habit was scheduled on a given date based on end date,
        paused state, and frequency settings.
        """
        # End date checks (past end date is outside tracking period)
        if habit.end_date and check_date > habit.end_date.date():
            return False
            
        # Pause checks
        if habit.is_paused and habit.pause_until and check_date <= habit.pause_until.date():
            return False
            
        # Frequency rules
        freq_type = habit.frequency_type or "daily"
        if freq_type == "daily":
            return True
        elif freq_type == "weekdays":
            return check_date.weekday() < 5 # 0..4 is Mon..Fri
        elif freq_type == "interval":
            days = habit.frequency_data.get("days", [0, 1, 2, 3, 4, 5, 6])
            return check_date.weekday() in days
        
        return True

    @staticmethod
    async def recalculate_habit_streak(
        db: AsyncSession,
        user_id: str,
        habit_id: str,
        reference_date: Optional[date] = None,
    ) -> Tuple[int, int]:
        """
        Recalculates current streak and longest streak for a specific habit.
        Returns (current_streak, longest_streak).
        """
        if reference_date is None:
            reference_date = date.today()

        # Fetch habit
        stmt_h = select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == user_id))
        res_h = await db.execute(stmt_h)
        habit = res_h.scalar_one_or_none()
        if not habit:
            return 0, 0

        # Fetch all completions for this habit sorted by date
        stmt_c = select(HabitCompletion).where(
            and_(HabitCompletion.habit_id == habit_id, HabitCompletion.user_id == user_id)
        ).order_by(HabitCompletion.date.asc())
        res_c = await db.execute(stmt_c)
        completions = res_c.scalars().all()

        completion_map: Dict[str, HabitCompletion] = {c.date: c for c in completions}

        # Calculate historical streaks
        if not completions and not habit.start_date:
            return 0, 0

        start_d = habit.start_date.date() if habit.start_date else (
            datetime.strptime(completions[0].date, "%Y-%m-%d").date() if completions else reference_date
        )

        longest_streak = 0
        current_streak = 0
        rolling_streak = 0
        
        cur_d = start_d
        while cur_d <= reference_date:
            date_str = cur_d.strftime("%Y-%m-%d")
            is_sched = StreakService.is_habit_scheduled_on_date(habit, cur_d)
            
            comp = completion_map.get(date_str)
            status = comp.status if comp else None
            
            if not is_sched or status == "rest_day":
                # Unscheduled or Rest day: keep rolling streak intact, doesn't increment or break
                pass
            elif status in ("completed", "partial"):
                rolling_streak += 1
                if rolling_streak > longest_streak:
                    longest_streak = rolling_streak
            else:
                # Missed scheduled day
                rolling_streak = 0

            cur_d += timedelta(days=1)

        # Current streak: look backwards from reference_date (or yesterday if today isn't logged yet)
        curr_calc_streak = 0
        check_back_d = reference_date
        
        # Check if today is completed/rest
        today_str = check_back_d.strftime("%Y-%m-%d")
        today_comp = completion_map.get(today_str)
        today_status = today_comp.status if today_comp else None
        
        # If today is scheduled and not logged yet, start checking from yesterday
        if StreakService.is_habit_scheduled_on_date(habit, check_back_d) and today_status not in ("completed", "partial", "rest_day"):
            check_back_d -= timedelta(days=1)

        while check_back_d >= start_d:
            d_str = check_back_d.strftime("%Y-%m-%d")
            is_sched = StreakService.is_habit_scheduled_on_date(habit, check_back_d)
            comp = completion_map.get(d_str)
            status = comp.status if comp else None

            if not is_sched or status == "rest_day":
                # Doesn't break streak
                pass
            elif status in ("completed", "partial"):
                curr_calc_streak += 1
            else:
                # Missed a scheduled day
                break
            check_back_d -= timedelta(days=1)

        # Update streak record in DB
        stmt_s = select(Streak).where(and_(Streak.user_id == user_id, Streak.habit_id == habit_id))
        res_s = await db.execute(stmt_s)
        streak_obj = res_s.scalar_one_or_none()
        if not streak_obj:
            streak_obj = Streak(user_id=user_id, habit_id=habit_id)
            db.add(streak_obj)
            
        streak_obj.current_streak = curr_calc_streak
        streak_obj.longest_streak = max(longest_streak, curr_calc_streak, streak_obj.longest_streak or 0)
        streak_obj.last_completed_date = reference_date.strftime("%Y-%m-%d")
        
        await db.commit()
        return streak_obj.current_streak, streak_obj.longest_streak

    @staticmethod
    async def get_overall_user_streak(db: AsyncSession, user_id: str) -> Tuple[int, int, int]:
        """
        Returns (current_streak, longest_streak, freezes_available)
        """
        stmt = select(Streak).where(and_(Streak.user_id == user_id, Streak.habit_id.is_(None)))
        res = await db.execute(stmt)
        streak_obj = res.scalar_one_or_none()
        
        if not streak_obj:
            # Query all habits and get the max current streak
            stmt_all = select(Streak).where(Streak.user_id == user_id)
            res_all = await db.execute(stmt_all)
            all_streaks = res_all.scalars().all()
            
            cur = max([s.current_streak for s in all_streaks], default=0)
            lng = max([s.longest_streak for s in all_streaks], default=0)
            
            streak_obj = Streak(
                user_id=user_id,
                habit_id=None,
                current_streak=cur,
                longest_streak=lng,
                freezes_available=2,
            )
            db.add(streak_obj)
            await db.commit()
            await db.refresh(streak_obj)

        return streak_obj.current_streak, streak_obj.longest_streak, streak_obj.freezes_available
