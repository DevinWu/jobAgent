from fastapi.testclient import TestClient
from app.main import app
from app import models
from app.database import SessionLocal, engine
from app.models import UserRole, DomainStatus, JobFailureCategory
from app.auth import get_password_hash

# 创建测试客户端
client = TestClient(app)

# 测试前创建数据库表
models.Base.metadata.create_all(bind=engine)

def test_get_job_analyses_by_domain():
    # 准备测试数据
    import uuid
    unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
    domain_id = None
    
    with SessionLocal() as db:
        # 创建一个测试用户，使用唯一的用户名
        test_user = models.User(
            username=unique_username,
            email=f"{unique_username}@example.com",
            hashed_password=get_password_hash("testpassword"),
            role=UserRole.USER
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        # 创建一个测试 domain
        test_domain = models.Domain(
            title="Test Domain",
            description="Test domain description",
            flow_config={"steps": []},
            creator_id=test_user.id,
            status=DomainStatus.PUBLISHED
        )
        db.add(test_domain)
        db.commit()
        db.refresh(test_domain)
        
        # 保存 domain_id 以便在会话外使用
        domain_id = test_domain.id

        # 创建几个测试 job 分析结果
        job_analysis1 = models.JobAnalysis(
            job_id="job1",
            domain_id=domain_id,
            failure_category=JobFailureCategory.UNKNOWN,
            root_cause_analysis="Test root cause 1",
            user_suggestions="Test suggestions 1",
            analysis_data={"key": "value1"}
        )
        job_analysis2 = models.JobAnalysis(
            job_id="job2",
            domain_id=domain_id,
            failure_category=JobFailureCategory.UNKNOWN,
            root_cause_analysis="Test root cause 2",
            user_suggestions="Test suggestions 2",
            analysis_data={"key": "value2"}
        )
        db.add_all([job_analysis1, job_analysis2])
        db.commit()

    # 获取测试用户的 token
    login_response = client.post(
        "/auth/login",
        data={"username": unique_username, "password": "testpassword"}
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    token = login_response.json()["access_token"]

    # 首先验证数据库中确实有我们创建的 job 分析
    with SessionLocal() as db:
        analyses = db.query(models.JobAnalysis).filter(
            models.JobAnalysis.domain_id == domain_id
        ).all()
        print(f"Found {len(analyses)} job analyses in database for domain {domain_id}")
        for analysis in analyses:
            print(f"Job ID: {analysis.job_id}, Domain ID: {analysis.domain_id}")

    # 确保我们确实创建了 job 分析
    assert len(analyses) > 0, "No job analyses found in database"
    
    # 直接使用之前保存的 domain_id
    print(f"Using domain_id: {domain_id}")
    
    # 调用 API 获取指定 domain 的 job 分析结果
    response = client.get(
        f"/job-analysis/jobs/domain/{domain_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    # 验证响应
    assert response.status_code == 200, f"API call failed: {response.text}"
    job_analyses = response.json()
    assert job_analyses is not None
    assert job_analyses["count"] > 0
    for job_analysis in job_analyses["results"]:
        assert job_analysis["job_id"] in ["job1", "job2"]
        assert job_analysis["domain_id"] == domain_id
        assert job_analysis["failure_category"] == JobFailureCategory.UNKNOWN.value
        assert "root_cause_analysis" in job_analysis
        assert "user_suggestions" in job_analysis
