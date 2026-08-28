from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.admin import AdminUserSummary, AdminStats, AdminUserDetail, UpdateUserRoleRequest
from app.services.admin_service import AdminService

router = APIRouter()

def require_superuser(user: User):
    if not user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to perform this action.",
        )

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_superuser(current_user)
    return await AdminService.get_stats(db)

@router.get("/users", response_model=List[AdminUserSummary])
async def list_admin_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_superuser(current_user)
    return await AdminService.get_all_users(db)

@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_admin_user_detail(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_superuser(current_user)
    detail = await AdminService.get_user_detail(db, user_id)
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return detail

@router.patch("/users/{user_id}/role", response_model=AdminUserSummary)
async def update_user_role(
    user_id: str,
    body: UpdateUserRoleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_superuser(current_user)
    updated = await AdminService.update_user_role(
        db=db,
        target_user_id=user_id,
        is_superuser=body.is_superuser,
        admin_username=current_user.username or "Admin",
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    require_superuser(current_user)
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own admin account.",
        )

    try:
        deleted = await AdminService.delete_user(db=db, target_user_id=user_id, admin_id=current_user.id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"success": True, "message": "User deleted successfully."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
