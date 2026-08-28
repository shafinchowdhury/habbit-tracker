from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse
from app.services.habit_service import HabitService

router = APIRouter()

@router.get("", response_model=List[HabitResponse])
async def list_habits(
    include_archived: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService.get_user_habits(db, current_user.id, include_archived=include_archived)

@router.post("", response_model=HabitResponse)
async def create_habit(
    habit_in: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService.create_habit(db, current_user.id, habit_in)

@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: str,
    habit_in: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService.update_habit(db, current_user.id, habit_id, habit_in)

@router.delete("/clear-all")
async def clear_all_habits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted_count = await HabitService.clear_all_habits(db, current_user.id)
    return {"message": f"Successfully cleared {deleted_count} habits", "deleted_count": deleted_count}

@router.delete("/clear-archives")
async def clear_all_archived_habits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted_count = await HabitService.clear_all_archived_habits(db, current_user.id)
    return {"message": f"Successfully cleared {deleted_count} archived habits", "deleted_count": deleted_count}

@router.delete("/{habit_id}")
async def delete_habit(
    habit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await HabitService.delete_habit(db, current_user.id, habit_id)
    return {"message": "Habit successfully deleted"}

