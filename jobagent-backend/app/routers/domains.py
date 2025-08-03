from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..crud import get_domains, get_domain, create_domain, update_domain, update_domain_admin
from .. import schemas, models
from ..database import get_db
from ..auth import get_current_user, get_current_admin_user

router = APIRouter(prefix="/domains", tags=["domains"])

@router.get("/", response_model=List[schemas.DomainResponse])
def read_domains(skip: int = 0, limit: int = 100, published_only: bool = True, db: Session = Depends(get_db)):
    domains = get_domains(db, skip=skip, limit=limit, published_only=published_only)
    return domains

@router.get("/{domain_id}", response_model=schemas.DomainResponse)
def read_domain(domain_id: int, db: Session = Depends(get_db)):
    db_domain = get_domain(db, domain_id=domain_id)
    if db_domain is None:
        raise HTTPException(status_code=404, detail="Domain not found")
    return db_domain

@router.post("/", response_model=schemas.DomainResponse)
def create_domain_endpoint(domain: schemas.DomainCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_domain(db=db, domain=domain, creator_id=current_user.id)

@router.put("/{domain_id}", response_model=schemas.DomainResponse)
def update_domain_endpoint(domain_id: int, domain_update: schemas.DomainUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_domain = get_domain(db, domain_id=domain_id)
    if db_domain is None:
        raise HTTPException(status_code=404, detail="Domain not found")
    if db_domain.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return update_domain(db=db, domain_id=domain_id, domain_update=domain_update)

@router.get("/my", response_model=List[schemas.DomainResponse])
def read_my_domains(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    domains = db.query(models.Domain).filter(models.Domain.creator_id == current_user.id).all()
    return domains

@router.put("/{domain_id}/admin", response_model=schemas.DomainResponse)
def admin_update_domain(
    domain_id: int, 
    admin_update: schemas.DomainAdminUpdate, 
    current_admin: models.User = Depends(get_current_admin_user), 
    db: Session = Depends(get_db)
):
    db_domain = get_domain(db, domain_id=domain_id)
    if db_domain is None:
        raise HTTPException(status_code=404, detail="Domain not found")
    return update_domain_admin(db=db, domain_id=domain_id, admin_update=admin_update)
