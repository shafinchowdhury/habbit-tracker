import json
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserSettings
from app.models.habit import Habit
from app.models.completion import HabitCompletion
from app.models.gamification import XPTransaction, UserLevel, UserAchievement, Achievement
from app.schemas.auth import UserSettingsResponse, UserSettingsUpdate

router = APIRouter()

@router.get("", response_model=UserSettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    settings = (await db.execute(stmt)).scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id, theme="clarity")
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return UserSettingsResponse.model_validate(settings)

@router.put("", response_model=UserSettingsResponse)
async def update_settings(
    settings_in: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UserSettings).where(UserSettings.user_id == current_user.id)
    settings = (await db.execute(stmt)).scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    update_data = settings_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(settings, k, v)

    await db.commit()
    await db.refresh(settings)
    return UserSettingsResponse.model_validate(settings)

@router.get("/export/json")
async def export_data_json(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Habits
    stmt_h = select(Habit).where(Habit.user_id == current_user.id)
    habits = (await db.execute(stmt_h)).scalars().all()

    # Completions
    stmt_c = select(HabitCompletion).where(HabitCompletion.user_id == current_user.id)
    completions = (await db.execute(stmt_c)).scalars().all()

    # XP
    stmt_xp = select(XPTransaction).where(XPTransaction.user_id == current_user.id)
    xp_txs = (await db.execute(stmt_xp)).scalars().all()

    export_payload = {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "first_name": current_user.first_name,
        },
        "habits": [
            {
                "id": h.id,
                "name": h.name,
                "category": h.category,
                "measurement_type": h.measurement_type,
                "target_value": h.target_value,
                "unit": h.unit,
                "created_at": h.created_at.isoformat() if h.created_at else None,
            }
            for h in habits
        ],
        "completions": [
            {
                "habit_id": c.habit_id,
                "date": c.date,
                "status": c.status,
                "actual_value": c.actual_value,
                "duration_minutes": c.duration_minutes,
                "note": c.note,
            }
            for c in completions
        ],
        "xp_history": [
            {
                "amount": x.amount,
                "source": x.source,
                "description": x.description,
                "created_at": x.created_at.isoformat() if x.created_at else None,
            }
            for x in xp_txs
        ],
    }

    content = json.dumps(export_payload, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=habitquest_export_{current_user.username}.json"},
    )

@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account and all associated habit data have been permanently deleted"}
