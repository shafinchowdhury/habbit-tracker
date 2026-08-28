from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class HabitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    default_duration_minutes: Optional[int] = 0
    icon: Optional[str] = "🎯"
    category: Optional[str] = "General"
    color: Optional[str] = "#2563EB"
    measurement_type: Optional[str] = "boolean"
    target_value: Optional[float] = 1.0
    unit: Optional[str] = "times"
    frequency_type: Optional[str] = "daily"
    frequency_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_paused: Optional[bool] = False
    pause_until: Optional[datetime] = None
    visibility: Optional[str] = "PRIVATE"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_days: Optional[int] = None
    order_index: Optional[int] = 0

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_duration_minutes: Optional[int] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    measurement_type: Optional[str] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    frequency_type: Optional[str] = None
    frequency_data: Optional[Dict[str, Any]] = None
    is_paused: Optional[bool] = None
    pause_until: Optional[datetime] = None
    is_archived: Optional[bool] = None
    visibility: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_days: Optional[int] = None
    order_index: Optional[int] = None

class HabitResponse(HabitBase):
    id: str
    user_id: str
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    current_streak: Optional[int] = 0
    longest_streak: Optional[int] = 0
    completion_rate: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)
