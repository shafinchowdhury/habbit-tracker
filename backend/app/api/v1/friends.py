from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.social import (
    FriendshipResponse,
    FriendUserSummary,
    FriendStreakResponse,
    ActivityFeedItem,
)
from app.services.friend_service import FriendService

router = APIRouter()

@router.get("", response_model=List[FriendshipResponse])
async def list_friends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await FriendService.get_user_friends(db, current_user.id)

@router.get("/search", response_model=List[FriendUserSummary])
async def search_users(
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await FriendService.search_users(db, current_user.id, q)

@router.post("/request/{username}", response_model=FriendshipResponse)
async def send_friend_request(
    username: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await FriendService.send_friend_request(db, current_user.id, username)

@router.post("/respond/{friendship_id}")
async def respond_to_friend_request(
    friendship_id: str,
    action: str = Query(..., pattern=r"^(accept|reject|block)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await FriendService.respond_to_friend_request(db, current_user.id, friendship_id, action)
    return {"message": f"Friend request {action}ed"}

@router.get("/streaks", response_model=List[FriendStreakResponse])
async def get_friend_streaks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await FriendService.get_friend_streaks(db, current_user.id)

@router.get("/activity", response_model=List[ActivityFeedItem])
async def get_activity_feed(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await FriendService.get_activity_feed(db, current_user.id)
