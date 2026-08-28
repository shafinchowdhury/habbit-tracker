from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: Optional[str] = ""
    avatar_url: Optional[str] = None
    timezone: Optional[str] = "UTC"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email_or_username: str
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserSettingsBase(BaseModel):
    theme: Optional[str] = "clarity"
    default_week_span: Optional[str] = "5"
    reduced_motion: Optional[bool] = False
    daily_reminder_time: Optional[str] = "20:00"
    reminder_enabled: Optional[bool] = False
    profile_visibility: Optional[str] = "PUBLIC"
    habit_visibility_default: Optional[str] = "PRIVATE"

class UserSettingsUpdate(UserSettingsBase):
    pass

class UserSettingsResponse(UserSettingsBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    settings: Optional[UserSettingsResponse] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
