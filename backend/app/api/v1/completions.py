from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.completion import HabitCompletion
from app.schemas.completion import (
    HabitCompletionCreate,
    HabitCompletionResponse,
    HabitCellToggle,
)
from app.services.habit_service import HabitService

router = APIRouter()

@router.post("/toggle")
async def toggle_habit_completion(
    toggle_in: HabitCellToggle,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await HabitService.toggle_completion(db, current_user.id, toggle_in)

@router.get("/day/{day_str}")
async def get_day_completions(
    day_str: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(HabitCompletion).where(
        and_(HabitCompletion.user_id == current_user.id, HabitCompletion.date == day_str)
    )
    res = await db.execute(stmt)
    completions = res.scalars().all()
    return completions

@router.delete("/clear-all")
@router.post("/clear-all")
async def clear_all_completions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted_count = await HabitService.clear_all_completions(db, current_user.id)
    return {"message": f"Successfully cleared {deleted_count} ticks/completions", "deleted_count": deleted_count}
