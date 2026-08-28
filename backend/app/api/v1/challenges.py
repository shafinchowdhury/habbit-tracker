from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.social import ChallengeCreate, ChallengeResponse
from app.services.challenge_service import ChallengeService

router = APIRouter()

@router.get("", response_model=List[ChallengeResponse])
async def list_challenges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChallengeService.list_challenges(db, current_user.id)

@router.post("", response_model=ChallengeResponse)
async def create_challenge(
    challenge_in: ChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChallengeService.create_challenge(db, current_user.id, challenge_in)

@router.get("/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChallengeService.get_challenge_by_id(db, challenge_id, current_user.id)

@router.post("/{challenge_id}/join", response_model=ChallengeResponse)
async def join_challenge(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChallengeService.join_challenge(db, challenge_id, current_user.id)
