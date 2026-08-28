from typing import List, Dict, Optional
from pydantic import BaseModel

class CompletionTrendPoint(BaseModel):
    date: str
    completion_rate: float
    completed_count: int
    scheduled_count: int

class CategoryBreakdown(BaseModel):
    category: str
    color: str
    habit_count: int
    completion_rate: float
    total_time_hours: float

class HabitRankingItem(BaseModel):
    habit_id: str
    name: str
    icon: str
    category: str
    current_streak: int
    longest_streak: int
    completion_rate: float
    total_completions: int

class AnalyticsResponse(BaseModel):
    time_range: str # 7d, 30d, 90d, 1y
    overall_completion_rate: float
    consistency_score: int
    total_habits_completed: int
    total_time_invested_hours: float
    trend: List[CompletionTrendPoint]
    category_breakdown: List[CategoryBreakdown]
    best_habits: List[HabitRankingItem]
    growth_areas: List[HabitRankingItem]
