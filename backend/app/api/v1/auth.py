from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, UserSettings
from app.models.gamification import UserLevel, Streak
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    UserUpdate,
    PasswordChange,
    UserSettingsResponse,
)
from app.api.deps import get_current_user

router = APIRouter()

def build_user_response(user: User, settings: UserSettings = None) -> UserResponse:
    settings_resp = None
    if settings:
        settings_resp = UserSettingsResponse(
            id=settings.id,
            user_id=settings.user_id,
            theme=settings.theme or "clarity",
            default_week_span=settings.default_week_span or "5",
            reduced_motion=bool(settings.reduced_motion),
            daily_reminder_time=settings.daily_reminder_time or "20:00",
            reminder_enabled=bool(settings.reminder_enabled),
            profile_visibility=settings.profile_visibility or "PUBLIC",
            habit_visibility_default=settings.habit_visibility_default or "PRIVATE",
            created_at=settings.created_at,
            updated_at=settings.updated_at,
        )
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        first_name=user.first_name or "",
        avatar_url=user.avatar_url,
        timezone=user.timezone or "UTC",
        is_active=bool(user.is_active),
        is_superuser=bool(user.is_superuser),
        created_at=user.created_at,
        settings=settings_resp,
    )

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if email or username already exists
    stmt = select(User).where(or_(User.email == user_in.email, User.username == user_in.username))
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or username already exists.",
    # If this is the very first user registering on the platform, make them Superuser Admin automatically
    count_stmt = select(func.count(User.id))
    user_count = (await db.execute(count_stmt)).scalar() or 0
    is_first_user = (user_count == 0)

    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.username}",
        timezone=user_in.timezone or "UTC",
        is_superuser=is_first_user,
    )
    db.add(user)
    await db.flush()

    # Create default user settings
    settings = UserSettings(user_id=user.id, theme="clarity")
    db.add(settings)

    # Initialize user level & streak
    level = UserLevel(user_id=user.id, total_xp=0, current_level=1)
    streak = Streak(user_id=user.id, current_streak=0, longest_streak=0, freezes_available=2)
    db.add(level)
    db.add(streak)

    await db.commit()
    await db.refresh(user)
    await db.refresh(settings)

    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer", user=build_user_response(user, settings))

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(
        or_(User.email == login_data.email_or_username, User.username == login_data.email_or_username)
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt_s = select(UserSettings).where(UserSettings.user_id == user.id)
    settings_obj = (await db.execute(stmt_s)).scalar_one_or_none()

    access_token = create_access_token(subject=user.id)
    return Token(access_token=access_token, token_type="bearer", user=build_user_response(user, settings_obj))

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt_s = select(UserSettings).where(UserSettings.user_id == current_user.id)
    settings_obj = (await db.execute(stmt_s)).scalar_one_or_none()
    return build_user_response(current_user, settings_obj)

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if update_in.first_name is not None:
        current_user.first_name = update_in.first_name
    if update_in.avatar_url is not None:
        current_user.avatar_url = update_in.avatar_url
    if update_in.timezone is not None:
        current_user.timezone = update_in.timezone

    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)

    stmt_s = select(UserSettings).where(UserSettings.user_id == current_user.id)
    settings_obj = (await db.execute(stmt_s)).scalar_one_or_none()
    return build_user_response(current_user, settings_obj)

@router.post("/change-password")
async def change_password(
    pwd_in: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    
    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Password successfully updated"}
