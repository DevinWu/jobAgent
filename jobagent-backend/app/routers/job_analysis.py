from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..crud import get_job_analysis, create_job_analysis, get_domain, get_job_analyses_by_domain
from ..auth import get_current_user
from .. import schemas, models
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/job-analysis", tags=["job-analysis"])

@router.post("/", response_model=schemas.JobAnalysisResponse)
async def analyze_job(
    analysis_request: schemas.JobAnalysisCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing_analysis = get_job_analysis(db, analysis_request.job_id, analysis_request.domain_id)
    if existing_analysis:
        return existing_analysis
    
    domain = get_domain(db, analysis_request.domain_id)
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    if domain.status != models.DomainStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Domain is not published")
    
    failure_category = models.JobFailureCategory.UNKNOWN
    root_cause = f"Analyzing job {analysis_request.job_id} in domain {domain.title}. This is a simulated analysis result."
    suggestions = "1. Check job logs for specific error messages\n2. Verify input parameters\n3. Contact support if issue persists"
    
    analysis_data = {
        "domain_config": domain.flow_config,
        "analysis_timestamp": "2024-01-01T00:00:00Z",
        "tools_used": []
    }
    
    new_analysis = create_job_analysis(
        db=db,
        job_id=analysis_request.job_id,
        domain_id=analysis_request.domain_id,
        failure_category=failure_category,
        root_cause=root_cause,
        suggestions=suggestions,
        analysis_data=analysis_data
    )
    
    return new_analysis

@router.get("/{job_id}/{domain_id}", response_model=schemas.JobAnalysisResponse)
def get_job_analysis_result(
    job_id: str,
    domain_id: int,
    db: Session = Depends(get_db)
):
    print(f"get_job_analysis_result for job: {job_id}, domain: {domain_id}")
    analysis = get_job_analysis(db, job_id, domain_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Job analysis jobs not found")
    return analysis

@router.get("/jobs/domain/{domain_id}", response_model=List[schemas.JobAnalysisResponse])
def get_domain_job_analyses(
    domain_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取指定 domain id 下的所有 job 分析结果
    """
    print(f"get_domain_job_analyses for domain: {domain_id}")
    # 检查 domain 是否存在
    domain = get_domain(db, domain_id=domain_id)
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # 获取该 domain 下的所有 job 分析结果
    analyses = get_job_analyses_by_domain(db, domain_id=domain_id, skip=skip, limit=limit)
    if not analyses:
        return []
    return analyses
