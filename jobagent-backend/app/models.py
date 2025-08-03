from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(enum.Enum):
    USER = "user"
    VIP_USER = "vip_user"
    ADMIN = "admin"

class JobFailureCategory(enum.Enum):
    UNKNOWN = "unknown"
    USER_INPUT_ERROR = "userInputError"
    THIRD_PLATFORM_ERROR = "ThirdPlatformError"
    PLATFORM_ERROR = "PlatformError"

class MCPToolStatus(enum.Enum):
    DRAFT = "draft"
    WAITING_FOR_ADMIN_REVIEW = "waiting_for_admin_review"
    PUBLISHED = "published"
    REJECTED = "rejected"

class DomainStatus(enum.Enum):
    DRAFT = "draft"
    WAITING_FOR_ADMIN_REVIEW = "waiting_for_admin_review"
    PUBLISHED = "published"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    domains = relationship("Domain", back_populates="creator")
    mcp_tools = relationship("MCPTool", back_populates="creator")

class Domain(Base):
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    flow_config = Column(JSON, nullable=False)
    status = Column(Enum(DomainStatus), default=DomainStatus.DRAFT)
    admin_comments = Column(Text)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="domains")
    job_analyses = relationship("JobAnalysis", back_populates="domain")

class MCPTool(Base):
    __tablename__ = "mcp_tools"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    api_url = Column(String(500), nullable=False)
    parameters = Column(JSON, nullable=False)
    sample_input = Column(JSON)
    status = Column(Enum(MCPToolStatus), default=MCPToolStatus.DRAFT)
    admin_comments = Column(Text)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="mcp_tools")

class JobAnalysis(Base):
    __tablename__ = "job_analyses"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(100), nullable=False, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    failure_category = Column(Enum(JobFailureCategory), nullable=False)
    root_cause_analysis = Column(Text, nullable=False)
    user_suggestions = Column(Text, nullable=False)
    analysis_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    domain = relationship("Domain", back_populates="job_analyses")
