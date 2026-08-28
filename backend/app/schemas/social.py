from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class FriendUserSummary(BaseModel):
    id: str
    username: str
    first_name: Optional[str] = ""
    avatar_url: Optional[str] = None
    level: int = 1
    total_xp: int = 0
    current_streak: int = 0

    model_config = ConfigDict(from_attributes=True)

class FriendshipResponse(BaseModel):
    id: str
    status: str
    friend: FriendUserSummary
    is_incoming: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FriendStreakResponse(BaseModel):
    id: str
    friend: FriendUserSummary
    current_streak: int
    longest_streak: int
    user_completed_today: bool
    friend_completed_today: bool
    is_active_today: bool

    model_config = ConfigDict(from_attributes=True)

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    is_read: bool
    link_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ActivityFeedItem(BaseModel):
    id: str
    user: FriendUserSummary
    type: str
    title: str
    payload: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChallengeParticipantSummary(BaseModel):
    user: FriendUserSummary
    completion_percentage: float
    days_completed: int
    is_completed: bool

    model_config = ConfigDict(from_attributes=True)

class ChallengeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    category: Optional[str] = "Coding"
    target_metric: Optional[str] = "Daily Completion"
    duration_days: Optional[int] = 30
    visibility: Optional[str] = "PUBLIC"
    xp_reward: Optional[int] = 500

class ChallengeResponse(BaseModel):
    id: str
    creator_id: str
    creator_name: str
    title: str
    description: Optional[str] = None
    category: str
    target_metric: str
    duration_days: int
    start_date: datetime
    end_date: Optional[datetime] = None
    max_participants: int
    visibility: str
    xp_reward: int
    is_joined: bool = False
    user_completion_percentage: float = 0.0
    participants_count: int
    leaderboard: List[ChallengeParticipantSummary] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
