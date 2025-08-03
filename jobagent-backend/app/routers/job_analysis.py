from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..crud import get_job_analysis, create_job_analysis, get_domain
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
    analysis = get_job_analysis(db, job_id, domain_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Job analysis not found")
    return analysis
