from datetime import datetime, date, timedelta
from typing import List, Dict, Tuple, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.models.gamification import UserLevel, Streak
from app.models.user import User
from app.services.streak_service import StreakService
from app.services.xp_service import calculate_level_from_xp
from app.schemas.dashboard import (
    DashboardResponse,
    WeeklyCard,
    DayBarData,
    DayColumnHeader,
    SummaryMetrics,
    DomainScore,
    HabitGridRow,
    CellData,
)
from app.schemas.analytics import (
    AnalyticsResponse,
    CompletionTrendPoint,
    CategoryBreakdown,
    HabitRankingItem,
)

WEEK_COLOR_THEMES = [
    "#3B82F6", # Week 1: Soft Blue
    "#EC4899", # Week 2: Soft Pink / Rose
    "#14B8A6", # Week 3: Soft Teal
    "#F59E0B", # Week 4: Soft Amber / Gold
    "#8B5CF6", # Week 5: Soft Slate / Lavender
    "#10B981", # Week 6: Soft Emerald
    "#6366F1", # Week 7: Indigo
    "#F97316", # Week 8: Coral
]

class AnalyticsService:
    @staticmethod
    def calculate_consistency_score(
        scheduled_count: int,
        completed_count: int,
        current_streak: int,
        recent_7d_completion_rate: float,
    ) -> int:
        """
        Calculates a deterministic 0-100 Consistency Score based on:
        1. Overall scheduled day adherence (45%)
        2. Current streak consistency (30%)
        3. Recency completion performance (25%)
        """
        if scheduled_count <= 0:
            return 0
            
        adherence_rate = (completed_count / scheduled_count) * 100.0
        adherence_score = min(100.0, adherence_rate)
        
        # Streak score normalized (e.g. 14+ days gives near 100 on streak component)
        streak_score = min(100.0, (current_streak / 14.0) * 100.0)
        
        # Recency score
        recency_score = min(100.0, recent_7d_completion_rate)
        
        composite = (0.45 * adherence_score) + (0.30 * streak_score) + (0.25 * recency_score)
        return max(0, min(100, int(round(composite))))

    @staticmethod
    async def get_dashboard_data(
        db: AsyncSession,
        user_id: str,
        week_span: int = 5,
        target_date_str: Optional[str] = None,
    ) -> DashboardResponse:
        """
        Builds the complete Dashboard data payload matching the reference image layout,
        scaled dynamically to `week_span` weeks (1 to 8).
        """
        week_span = max(1, min(8, week_span))
        
        if target_date_str:
            try:
                ref_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
            except ValueError:
                ref_date = date.today()
        else:
            ref_date = date.today()

        # Calculate start of the display period:
        # Align reference_date to the end of the current week (Friday).
        # Week runs Saturday to Friday.
        # Python weekday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
        # sat_offset: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
        sat_offset = (ref_date.weekday() + 2) % 7
        end_of_current_week = ref_date + timedelta(days=(6 - sat_offset))
        start_date = end_of_current_week - timedelta(days=(week_span * 7 - 1))
        end_date = end_of_current_week

        # 1. Fetch User Info & Level
        stmt_u = select(User).where(User.id == user_id)
        user = (await db.execute(stmt_u)).scalar_one_or_none()
        user_name = user.first_name if (user and user.first_name) else (user.username if user else "Tracker")
        user_avatar = user.avatar_url if user else None

        stmt_lvl = select(UserLevel).where(UserLevel.user_id == user_id)
        lvl_obj = (await db.execute(stmt_lvl)).scalar_one_or_none()
        total_xp = lvl_obj.total_xp if lvl_obj else 0
        lvl, cur_xp, target_xp = calculate_level_from_xp(total_xp)

        # 2. Fetch all Active Habits for user
        stmt_h = select(Habit).where(
            and_(Habit.user_id == user_id, Habit.is_archived.is_(False))
        ).order_by(Habit.order_index.asc(), Habit.created_at.asc())
        habits = (await db.execute(stmt_h)).scalars().all()

        # 3. Fetch Completions in range
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        
        stmt_c = select(HabitCompletion).where(
            and_(
                HabitCompletion.user_id == user_id,
                HabitCompletion.date >= start_str,
                HabitCompletion.date <= end_str,
            )
        )
        completions = (await db.execute(stmt_c)).scalars().all()
        # Map: (habit_id, date_str) -> completion
        comp_map: Dict[Tuple[str, str], HabitCompletion] = {
            (c.habit_id, c.date): c for c in completions
        }

        # 4. Generate Day Column Headers & Weekly Structure (Saturday to Friday)
        today_str = date.today().strftime("%Y-%m-%d")
        sat_day_letters = ["S", "S", "M", "T", "W", "T", "F"]
        
        column_headers: List[DayColumnHeader] = []
        weekly_cards: List[WeeklyCard] = []
        
        total_scheduled_in_span = 0
        total_completed_in_span = 0
        total_time_invested_minutes = 0.0
        daily_time_invested: Dict[str, float] = {}

        # Domain category tallies for Radar Chart
        domain_counts: Dict[str, int] = {}
        domain_completions: Dict[str, int] = {}

        # Iterate over each week in the span
        for w_idx in range(week_span):
            w_start = start_date + timedelta(days=w_idx * 7)
            w_end = w_start + timedelta(days=6)
            w_color = WEEK_COLOR_THEMES[w_idx % len(WEEK_COLOR_THEMES)]
            
            w_days: List[DayBarData] = []
            w_scheduled = 0
            w_completed = 0
            w_habit_completions_count: Dict[str, int] = {}

            for d_idx in range(7):
                cur_d = w_start + timedelta(days=d_idx)
                d_str = cur_d.strftime("%Y-%m-%d")
                is_fut = cur_d > date.today()
                is_tod = (d_str == today_str)

                # Column header
                column_headers.append(
                    DayColumnHeader(
                        date=d_str,
                        day_letter=sat_day_letters[(cur_d.weekday() + 2) % 7],
                        day_number=cur_d.day,
                        week_index=w_idx + 1,
                        is_today=is_tod,
                        is_future=is_fut,
                    )
                )

                # Count habit completions for this day
                day_sched = 0
                day_comp = 0
                day_time_mins = 0.0

                for h in habits:
                    is_sched = StreakService.is_habit_scheduled_on_date(h, cur_d)
                    c = comp_map.get((h.id, d_str))
                    status = c.status if c else None
                    
                    if is_sched and not is_fut:
                        day_sched += 1
                        total_scheduled_in_span += 1
                        domain_counts[h.category] = domain_counts.get(h.category, 0) + 1

                    if status in ("completed", "partial"):
                        day_comp += 1
                        total_completed_in_span += 1
                        w_habit_completions_count[h.name] = w_habit_completions_count.get(h.name, 0) + 1
                        domain_completions[h.category] = domain_completions.get(h.category, 0) + 1

                    if c and c.duration_minutes:
                        day_time_mins += c.duration_minutes

                total_time_invested_minutes += day_time_mins
                daily_time_invested[d_str] = round(day_time_mins / 60.0, 1)

                rate = (day_comp / day_sched * 100.0) if day_sched > 0 else (0.0 if is_fut else 100.0)
                w_scheduled += day_sched
                w_completed += day_comp

                w_days.append(
                    DayBarData(
                        day_letter=sat_day_letters[(cur_d.weekday() + 2) % 7],
                        day_number=cur_d.day,
                        date=d_str,
                        completion_rate=round(rate, 1),
                        completed_count=day_comp,
                        total_count=day_sched,
                        is_today=is_tod,
                        is_future=is_fut,
                    )
                )

            w_rate = (w_completed / w_scheduled * 100.0) if w_scheduled > 0 else 0.0
            
            # Find strongest habit in this week
            strongest_name = "Consistent"
            if w_habit_completions_count:
                strongest_name = max(w_habit_completions_count.items(), key=lambda x: x[1])[0]

            weekly_cards.append(
                WeeklyCard(
                    week_index=w_idx + 1,
                    week_label=f"Week {w_idx + 1}",
                    start_date=w_start.strftime("%Y-%m-%d"),
                    end_date=w_end.strftime("%Y-%m-%d"),
                    accent_color=w_color,
                    completion_percentage=round(w_rate, 1),
                    target_threshold=80.0,
                    average_threshold=70.0,
                    days=w_days,
                    strongest_habit_label=strongest_name,
                    highlight_metric=f"{int(round(w_rate))}% | {strongest_name}",
                )
            )

        # 5. Build Main Habit Grid Rows
        habit_rows: List[HabitGridRow] = []
        for h in habits:
            cells: Dict[str, CellData] = {}
            h_sched_count = 0
            h_comp_count = 0

            cur_d = start_date
            while cur_d <= end_date:
                d_str = cur_d.strftime("%Y-%m-%d")
                is_fut = cur_d > date.today()
                is_sched = StreakService.is_habit_scheduled_on_date(h, cur_d)
                c = comp_map.get((h.id, d_str))

                if is_fut:
                    status = "future"
                elif c:
                    status = c.status
                elif not is_sched:
                    status = "rest_day"
                else:
                    status = "missed"

                if is_sched and not is_fut:
                    h_sched_count += 1
                if status in ("completed", "partial"):
                    h_comp_count += 1

                target_v = c.target_value if c else h.target_value
                act_v = c.actual_value if c else (h.target_value if status == "completed" else 0.0)
                dur = c.duration_minutes if c else (h.default_duration_minutes or 0.0)
                note = c.note if c else None

                cells[d_str] = CellData(
                    status=status,
                    actual_value=act_v,
                    target_value=target_v,
                    unit=h.unit,
                    duration_minutes=dur,
                    note=note,
                )
                cur_d += timedelta(days=1)

            h_rate = (h_comp_count / h_sched_count * 100.0) if h_sched_count > 0 else 0.0
            
            # Format target / description text for dashboard row
            target_str = h.description or (f"{h.default_duration_minutes} mins" if h.default_duration_minutes else "")

            habit_rows.append(
                HabitGridRow(
                    id=h.id,
                    name=h.name,
                    description=h.description,
                    default_duration_minutes=h.default_duration_minutes or 0,
                    icon=h.icon or "🎯",
                    category=h.category or "General",
                    color=h.color or "#2563EB",
                    target_text=target_str,
                    target_days=h.target_days,
                    start_date=h.start_date.strftime("%Y-%m-%d") if h.start_date else None,
                    end_date=h.end_date.strftime("%Y-%m-%d") if h.end_date else None,
                    completion_percentage=round(h_rate, 1),
                    cells=cells,
                )
            )

        # 6. Overall Metrics & Consistency Score
        overall_comp_pct = (
            (total_completed_in_span / total_scheduled_in_span * 100.0)
            if total_scheduled_in_span > 0
            else 0.0
        )
        
        cur_streak, longest_streak, freezes = await StreakService.get_overall_user_streak(db, user_id)
        
        # Last 7 days rate for consistency algorithm
        recent_week_card = weekly_cards[-1] if weekly_cards else None
        recent_rate = recent_week_card.completion_percentage if recent_week_card else overall_comp_pct

        consistency_score = AnalyticsService.calculate_consistency_score(
            scheduled_count=total_scheduled_in_span,
            completed_count=total_completed_in_span,
            current_streak=cur_streak,
            recent_7d_completion_rate=recent_rate,
        )

        # Domain Balance scores for Radar Chart
        domain_list = ["Health", "Fitness", "Learning", "Coding", "Productivity", "Mindfulness"]
        domain_scores: List[DomainScore] = []
        for dom in domain_list:
            sched_dom = domain_counts.get(dom, 0)
            comp_dom = domain_completions.get(dom, 0)
            dom_score = (comp_dom / sched_dom * 100.0) if sched_dom > 0 else 75.0 # baseline if no habits
            hab_count = len([h for h in habits if h.category == dom])
            domain_scores.append(
                DomainScore(
                    domain=dom,
                    score=round(dom_score, 1),
                    habits_count=hab_count,
                )
            )

        total_hours = total_time_invested_minutes / 60.0
        time_formatted = f"{total_hours:.1f}h"

        summary = SummaryMetrics(
            overall_completion_percentage=round(overall_comp_pct, 1),
            consistency_score=consistency_score,
            current_streak_days=cur_streak,
            longest_streak_days=longest_streak,
            streak_freezes_available=freezes,
            domain_balance=domain_scores,
            total_time_invested_hours=round(total_hours, 1),
            time_invested_formatted=time_formatted,
        )

        return DashboardResponse(
            user_name=user_name,
            user_avatar=user_avatar,
            level=lvl,
            current_xp=cur_xp,
            target_xp=target_xp,
            selected_week_span=week_span,
            start_date=start_str,
            end_date=end_str,
            column_headers=column_headers,
            weekly_cards=weekly_cards,
            summary=summary,
            habit_rows=habit_rows,
            daily_time_invested=daily_time_invested,
        )

    @staticmethod
    async def get_analytics_page_data(
        db: AsyncSession,
        user_id: str,
        time_range: str = "30d",
    ) -> AnalyticsResponse:
        """
        Returns advanced analytics for the dedicated Analytics page.
        """
        days_count = 30
        if time_range == "7d":
            days_count = 7
        elif time_range == "90d":
            days_count = 90
        elif time_range == "1y":
            days_count = 365

        end_d = date.today()
        start_d = end_d - timedelta(days=days_count - 1)
        start_str = start_d.strftime("%Y-%m-%d")
        end_str = end_d.strftime("%Y-%m-%d")

        # Fetch habits
        stmt_h = select(Habit).where(and_(Habit.user_id == user_id, Habit.is_archived.is_(False)))
        habits = (await db.execute(stmt_h)).scalars().all()

        # Fetch completions
        stmt_c = select(HabitCompletion).where(
            and_(
                HabitCompletion.user_id == user_id,
                HabitCompletion.date >= start_str,
                HabitCompletion.date <= end_str,
            )
        )
        completions = (await db.execute(stmt_c)).scalars().all()
        comp_map = {(c.habit_id, c.date): c for c in completions}

        # Trend points
        trend: List[CompletionTrendPoint] = []
        cur_d = start_d
        tot_sched = 0
        tot_comp = 0
        tot_time_mins = 0.0

        cat_counts: Dict[str, int] = {}
        cat_comp: Dict[str, int] = {}
        cat_time: Dict[str, float] = {}

        while cur_d <= end_d:
            d_str = cur_d.strftime("%Y-%m-%d")
            d_sched = 0
            d_comp = 0

            for h in habits:
                is_sched = StreakService.is_habit_scheduled_on_date(h, cur_d)
                c = comp_map.get((h.id, d_str))
                status = c.status if c else None

                if is_sched:
                    d_sched += 1
                    tot_sched += 1
                    cat_counts[h.category] = cat_counts.get(h.category, 0) + 1

                if status in ("completed", "partial"):
                    d_comp += 1
                    tot_comp += 1
                    cat_comp[h.category] = cat_comp.get(h.category, 0) + 1

                if c and c.duration_minutes:
                    tot_time_mins += c.duration_minutes
                    cat_time[h.category] = cat_time.get(h.category, 0.0) + c.duration_minutes

            rate = (d_comp / d_sched * 100.0) if d_sched > 0 else 0.0
            trend.append(
                CompletionTrendPoint(
                    date=d_str,
                    completion_rate=round(rate, 1),
                    completed_count=d_comp,
                    scheduled_count=d_sched,
                )
            )
            cur_d += timedelta(days=1)

        # Categories
        category_breakdown: List[CategoryBreakdown] = []
        cat_colors = {
            "Health": "#14B8A6",
            "Fitness": "#22C55E",
            "Learning": "#6366F1",
            "Coding": "#8B5CF6",
            "Productivity": "#F59E0B",
            "Mindfulness": "#EC4899",
            "Reading": "#3B82F6",
            "Custom": "#A855F7",
        }
        for cat, sched_c in cat_counts.items():
            comp_c = cat_comp.get(cat, 0)
            rate = (comp_c / sched_c * 100.0) if sched_c > 0 else 0.0
            t_hours = cat_time.get(cat, 0.0) / 60.0
            h_count = len([h for h in habits if h.category == cat])
            category_breakdown.append(
                CategoryBreakdown(
                    category=cat,
                    color=cat_colors.get(cat, "#8B5CF6"),
                    habit_count=h_count,
                    completion_rate=round(rate, 1),
                    total_time_hours=round(t_hours, 1),
                )
            )

        # Rankings
        rankings: List[HabitRankingItem] = []
        for h in habits:
            # fetch streak
            cur_s, long_s = await StreakService.recalculate_habit_streak(db, user_id, h.id)
            h_comp_count = len([c for c in completions if c.habit_id == h.id and c.status in ("completed", "partial")])
            h_sched_count = sum(
                1 for i in range(days_count)
                if StreakService.is_habit_scheduled_on_date(h, start_d + timedelta(days=i))
            )
            h_rate = (h_comp_count / h_sched_count * 100.0) if h_sched_count > 0 else 0.0
            
            rankings.append(
                HabitRankingItem(
                    habit_id=h.id,
                    name=h.name,
                    icon=h.icon or "🎯",
                    category=h.category or "Productivity",
                    current_streak=cur_s,
                    longest_streak=long_s,
                    completion_rate=round(h_rate, 1),
                    total_completions=h_comp_count,
                )
            )

        rankings.sort(key=lambda x: x.completion_rate, reverse=True)
        best_habits = rankings[:5]
        growth_areas = rankings[-3:] if len(rankings) > 3 else []

        overall_rate = (tot_comp / tot_sched * 100.0) if tot_sched > 0 else 0.0
        cur_streak, _, _ = await StreakService.get_overall_user_streak(db, user_id)
        consistency = AnalyticsService.calculate_consistency_score(
            scheduled_count=tot_sched,
            completed_count=tot_comp,
            current_streak=cur_streak,
            recent_7d_completion_rate=overall_rate,
        )

        return AnalyticsResponse(
            time_range=time_range,
            overall_completion_rate=round(overall_rate, 1),
            consistency_score=consistency,
            total_habits_completed=tot_comp,
            total_time_invested_hours=round(tot_time_mins / 60.0, 1),
            trend=trend,
            category_breakdown=category_breakdown,
            best_habits=best_habits,
            growth_areas=growth_areas,
        )
