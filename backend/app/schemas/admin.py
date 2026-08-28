from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.habit import HabitResponse

class AdminUserSummary(BaseModel):
    id: str
    username: str
    email: str
    first_name: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = "UTC"
    is_active: bool = True
    is_superuser: bool = False
    created_at: datetime
    total_habits: int = 0
    active_habits: int = 0
    total_completions: int = 0
    level: int = 1
    current_xp: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    settings: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class AdminStats(BaseModel):
    total_users: int
    total_active_habits: int
    total_completions: int
    total_xp: int
    total_challenges: int
    active_users_last_7d: int

class AdminUserDetail(BaseModel):
    user: AdminUserSummary
    habits: List[HabitResponse]
    recent_activity: List[Dict[str, Any]] = []
