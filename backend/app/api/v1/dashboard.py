from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    week_span: int = Query(5, ge=1, le=8, description="Number of weeks to display (1 to 8)"),
    target_date: Optional[str] = Query(None, description="Optional focus date YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AnalyticsService.get_dashboard_data(
        db,
        user_id=current_user.id,
        week_span=week_span,
        target_date_str=target_date,
    )
