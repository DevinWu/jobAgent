from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from sqlalchemy.sql.functions import count

from ..crud import get_job_analysis, create_job_analysis, get_domain, get_job_analyses_by_domain, \
    delete_job_analysis_by_domain, accept_job_analysis
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
        analysis_status=models.JobAnalysisStatus.IN_PROGRESS,
        failure_category=failure_category,
        root_cause='',
        suggestions='',
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

@router.delete("/{job_id}/{domain_id}", status_code=204)
def delete_job_analysis(
    job_id: str,
    domain_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    删除指定 job_id 和 domain_id 的 job 分析记录
    """
    analysis = get_job_analysis(db, job_id, domain_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Job analysis not found")
    
    if not delete_job_analysis_by_domain(db, job_id, domain_id):
        raise HTTPException(status_code=500, detail="Failed to delete job analysis")
    
    return None

@router.get("/jobs/domain/{domain_id}", response_model=schemas.JobAnalysisListResponse)
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
    print(f"Return a job list with size: {len(analyses)}")
    if len(analyses) >= 1:
        print(f"show one jobs with detail: {analyses[0]}")
    return schemas.JobAnalysisListResponse(results=analyses or [], count=len(analyses))

@router.put("/accept/{job_id}/{domain_id}", response_model=schemas.JobAnalysisResponse)
def accept_job_analysis_endpoint(
    job_id: str,
    domain_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    接受作业分析结果，将状态从COMPLETED更新为ACCEPTED，并记录审核人和审核时间
    
    Args:
        job_id: 作业ID
        domain_id: 领域ID
        current_user: 当前用户（审核人）
        db: 数据库会话
        
    Returns:
        更新后的JobAnalysis对象
    """
    # 检查作业分析是否存在
    analysis = get_job_analysis(db, job_id, domain_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Job analysis not found")
    
    # 检查作业分析状态是否为COMPLETED
    if analysis.analysis_status != models.JobAnalysisStatus.COMPLETED:
        raise HTTPException(
            status_code=400, 
            detail=f"Job analysis status must be COMPLETED to accept, current status: {analysis.analysis_status}"
        )
    
    # 更新作业分析状态为ACCEPTED，并记录审核人和审核时间
    updated_analysis = accept_job_analysis(db, job_id, domain_id, current_user.id)
    if not updated_analysis:
        raise HTTPException(status_code=500, detail="Failed to accept job analysis")
    
    return updated_analysis
