from typing import List, Dict, Optional, Any
from pydantic import BaseModel

class DayBarData(BaseModel):
    day_letter: str # M, T, W, T, F, S, S
    day_number: int # 1, 2, 3...
    date: str # YYYY-MM-DD
    completion_rate: float # 0.0 to 100.0
    completed_count: int
    total_count: int
    is_today: bool = False
    is_future: bool = False

class WeeklyCard(BaseModel):
    week_index: int
    week_label: str # "Week 1", "Week 2"...
    start_date: str
    end_date: str
    accent_color: str # "blue", "rose", "teal", "amber", "slate", "violet", "emerald"
    completion_percentage: float
    target_threshold: float = 80.0
    average_threshold: float = 70.0
    days: List[DayBarData]
    strongest_habit_label: Optional[str] = "Coding"
    highlight_metric: Optional[str] = "88% | Sleep"

class DomainScore(BaseModel):
    domain: str # Health, Fitness, Learning, Coding, Productivity, Mindfulness
    score: float # 0 - 100
    habits_count: int

class SummaryMetrics(BaseModel):
    overall_completion_percentage: float
    consistency_score: int
    current_streak_days: int
    longest_streak_days: int
    streak_freezes_available: int
    domain_balance: List[DomainScore]
    total_time_invested_hours: float
    time_invested_formatted: str

class CellData(BaseModel):
    status: str # completed, partial, skipped, rest_day, missed, future
    actual_value: Optional[float] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    duration_minutes: Optional[float] = None
    note: Optional[str] = None

class HabitGridRow(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    default_duration_minutes: Optional[int] = 0
    icon: str
    category: str
    color: str
    target_text: str # "2 hrs/day", "2.5L/day" or description
    target_days: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    completion_percentage: float
    cells: Dict[str, CellData] # date -> CellData

class DayColumnHeader(BaseModel):
    date: str
    day_letter: str # M, T, W, T, F, S, S
    day_number: int
    week_index: int
    is_today: bool
    is_future: bool

class DashboardResponse(BaseModel):
    user_name: str
    user_avatar: Optional[str] = None
    level: int
    current_xp: int
    target_xp: int
    selected_week_span: int
    start_date: str
    end_date: str
    column_headers: List[DayColumnHeader]
    weekly_cards: List[WeeklyCard]
    summary: SummaryMetrics
    habit_rows: List[HabitGridRow]
    daily_time_invested: Dict[str, float] # date -> hours
