from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from .models import UserRole, JobFailureCategory, MCPToolStatus, DomainStatus, JobAnalysisStatus


class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class DomainBase(BaseModel):
    title: str
    description: str
    flow_config: Dict[str, Any]

class DomainCreate(DomainBase):
    status: Optional[DomainStatus] = None
    pass

class DomainUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    flow_config: Optional[Dict[str, Any]] = None
    status: Optional[DomainStatus] = None

class DomainResponse(DomainBase):
    id: int
    status: DomainStatus
    admin_comments: Optional[str]
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
        use_enum_values = True

class MCPToolBase(BaseModel):
    title: str
    api_url: str
    parameters: Dict[str, Any]

class MCPToolCreate(MCPToolBase):
    pass

class MCPToolUpdate(BaseModel):
    title: Optional[str] = None
    api_url: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    sample_input: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class MCPToolResponse(MCPToolBase):
    id: int
    status: MCPToolStatus
    sample_input: Optional[Dict[str, Any]]
    admin_comments: Optional[str]
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class MCPToolAdminUpdate(BaseModel):
    status: MCPToolStatus
    admin_comments: Optional[str] = None

class DomainAdminUpdate(BaseModel):
    status: DomainStatus
    admin_comments: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: UserRole

class UserDefaultDomainUpdate(BaseModel):
    default_domain_id: int

class JobAnalysisCreate(BaseModel):
    job_id: str
    domain_id: int

class JobAnalysisResponse(BaseModel):
    id: int
    job_id: str
    domain_id: int
    failure_category: JobFailureCategory
    root_cause_analysis: str
    analysis_status: JobAnalysisStatus
    user_suggestions: str
    analysis_data: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime] = None
    reviewer_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MCPToolExecuteRequest(BaseModel):
    parameters: Dict[str, Any]

class MCPToolExecuteResponse(BaseModel):
    success: bool
    response: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class JobAnalysisListResponse(BaseModel):
    results: List[JobAnalysisResponse]
    count: int

class JobAnalysisAccept(BaseModel):
    """接受作业分析的请求模型"""
    job_id: str
    domain_id: int
