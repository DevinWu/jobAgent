from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..crud import get_all_users, update_user_role, get_domains
from .. import schemas, models
from ..database import get_db
from ..auth import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[schemas.UserResponse])
def get_users(
    current_admin: models.User = Depends(get_current_admin_user), 
    db: Session = Depends(get_db)
):
    return get_all_users(db)

@router.put("/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role_endpoint(
    user_id: int,
    role_update: schemas.UserRoleUpdate,
    current_admin: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    return update_user_role(db, user_id, role_update)

@router.get("/domains", response_model=List[schemas.DomainResponse])
def get_domains_for_review(
    current_admin: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    return get_domains(db, published_only=False)
