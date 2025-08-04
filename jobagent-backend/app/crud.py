from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from . import models, schemas
from .auth import get_password_hash, verify_password

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def get_domains(db: Session, skip: int = 0, limit: int = 100, published_only: bool = False):
    query = db.query(models.Domain)
    if published_only:
        query = query.filter(models.Domain.status == models.DomainStatus.PUBLISHED)
    return query.offset(skip).limit(limit).all()

def get_domain(db: Session, domain_id: int):
    return db.query(models.Domain).filter(models.Domain.id == domain_id).first()

def create_domain(db: Session, domain: schemas.DomainCreate, creator_id: int):
    db_domain = models.Domain(
        title=domain.title,
        description=domain.description,
        flow_config=domain.flow_config,
        creator_id=creator_id
    )
    db.add(db_domain)
    db.commit()
    db.refresh(db_domain)
    return db_domain

def update_domain(db: Session, domain_id: int, domain_update: schemas.DomainUpdate):
    db_domain = db.query(models.Domain).filter(models.Domain.id == domain_id).first()
    if db_domain:
        update_data = domain_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_domain, field, value)
        db.commit()
        db.refresh(db_domain)
    return db_domain

def get_mcp_tools(db: Session, skip: int = 0, limit: int = 100, status: Optional[models.MCPToolStatus] = None, creator_id: Optional[int] = None):
    query = db.query(models.MCPTool)
    if status:
        query = query.filter(models.MCPTool.status == status)
    if creator_id:
        query = query.filter(models.MCPTool.creator_id == creator_id)
    return query.offset(skip).limit(limit).all()

def get_mcp_tool(db: Session, tool_id: int):
    return db.query(models.MCPTool).filter(models.MCPTool.id == tool_id).first()

def create_mcp_tool(db: Session, tool: schemas.MCPToolCreate, creator_id: int):
    db_tool = models.MCPTool(
        title=tool.title,
        api_url=tool.api_url,
        parameters=tool.parameters,
        creator_id=creator_id
    )
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool

def update_mcp_tool(db: Session, tool_id: int, tool_update: schemas.MCPToolUpdate):
    db_tool = db.query(models.MCPTool).filter(models.MCPTool.id == tool_id).first()
    if db_tool:
        update_data = tool_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_tool, field, value)
        db.commit()
        db.refresh(db_tool)
    return db_tool

def update_mcp_tool_admin(db: Session, tool_id: int, admin_update: schemas.MCPToolAdminUpdate):
    db_tool = db.query(models.MCPTool).filter(models.MCPTool.id == tool_id).first()
    if db_tool:
        db_tool.status = admin_update.status
        if admin_update.admin_comments:
            db_tool.admin_comments = admin_update.admin_comments
        db.commit()
        db.refresh(db_tool)
    return db_tool

def get_job_analysis(db: Session, job_id: str, domain_id: int):
    return db.query(models.JobAnalysis).filter(
        and_(models.JobAnalysis.job_id == job_id, models.JobAnalysis.domain_id == domain_id)
    ).first()

def create_job_analysis(db: Session, job_id: str, domain_id: int, failure_category: models.JobFailureCategory, root_cause: str, suggestions: str, analysis_data: Optional[dict] = None):
    db_analysis = models.JobAnalysis(
        job_id=job_id,
        domain_id=domain_id,
        failure_category=failure_category,
        root_cause_analysis=root_cause,
        user_suggestions=suggestions,
        analysis_data=analysis_data
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

def update_domain_admin(db: Session, domain_id: int, admin_update: schemas.DomainAdminUpdate):
    db_domain = db.query(models.Domain).filter(models.Domain.id == domain_id).first()
    if db_domain:
        db_domain.status = admin_update.status
        if admin_update.admin_comments:
            db_domain.admin_comments = admin_update.admin_comments
        db.commit()
        db.refresh(db_domain)
    return db_domain

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user_role(db: Session, user_id: int, role_update: schemas.UserRoleUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.role = role_update.role
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_mcp_tool(db: Session, tool_id: int):
    db_tool = db.query(models.MCPTool).filter(models.MCPTool.id == tool_id).first()
    if db_tool:
        db.delete(db_tool)
        db.commit()
        return True
    return False

def create_admin_user(db: Session):
    existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not existing_admin:
        hashed_password = get_password_hash("test1234")
        admin_user = models.User(
            username="admin",
            email="admin@jobagent.com",
            hashed_password=hashed_password,
            role=models.UserRole.ADMIN
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        return admin_user
    return existing_admin
