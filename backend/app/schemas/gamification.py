from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AchievementResponse(BaseModel):
    id: str
    code: str
    title: str
    description: str
    icon: str
    xp_reward: int
    category: str
    tier: str
    target_value: int
    is_unlocked: bool = False
    progress_value: int = 0
    unlocked_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class XPTransactionResponse(BaseModel):
    id: str
    amount: int
    source: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LevelStatusResponse(BaseModel):
    current_level: int
    total_xp: int
    level_current_xp: int
    level_target_xp: int
    progress_percentage: float
    title: str
    next_level_reward: str

    model_config = ConfigDict(from_attributes=True)

class GamificationOverviewResponse(BaseModel):
    level: LevelStatusResponse
    streaks: dict
    achievements: List[AchievementResponse]
    recent_xp: List[XPTransactionResponse]

    model_config = ConfigDict(from_attributes=True)
