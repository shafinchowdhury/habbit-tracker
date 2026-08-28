from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class HabitCompletionBase(BaseModel):
    habit_id: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$") # YYYY-MM-DD
    status: Optional[str] = "completed"
    target_value: Optional[float] = 1.0
    actual_value: Optional[float] = 1.0
    duration_minutes: Optional[float] = 0.0
    note: Optional[str] = None

class HabitCompletionCreate(HabitCompletionBase):
    pass

class HabitCompletionUpdate(BaseModel):
    status: Optional[str] = None
    actual_value: Optional[float] = None
    duration_minutes: Optional[float] = None
    note: Optional[str] = None

class HabitCompletionResponse(HabitCompletionBase):
    id: str
    user_id: str
    completed_at: datetime
    xp_earned: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class HabitCellToggle(BaseModel):
    habit_id: str
    date: str
    status: Optional[str] = "completed"
    actual_value: Optional[float] = None
    duration_minutes: Optional[float] = None
    note: Optional[str] = None
