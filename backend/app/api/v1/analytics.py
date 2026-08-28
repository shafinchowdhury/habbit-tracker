from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    time_range: str = Query("30d", pattern=r"^(7d|30d|90d|1y)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AnalyticsService.get_analytics_page_data(
        db,
        user_id=current_user.id,
        time_range=time_range,
    )
