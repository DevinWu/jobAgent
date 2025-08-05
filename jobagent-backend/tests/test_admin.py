from sqlalchemy.orm import Session
from app import models, schemas, crud
from app.routers import admin
from app.models import DomainStatus
from app.database import SessionLocal, engine

# 在运行测试前创建数据库表
models.Base.metadata.create_all(bind=engine)


def test_get_domains_for_review():
    # 获取数据库会话
    db: Session = SessionLocal()

    try:
        # 创建一个已发布的域
        published_domain = models.Domain(
            title="Published Domain",
            description="This is a published domain",
            flow_config={"steps": []},
            creator_id=1,
            status=DomainStatus.PUBLISHED
        )
        db.add(published_domain)

        # 创建一个未发布的域
        unpublished_domain = models.Domain(
            title="Unpublished Domain",
            description="This is an unpublished domain",
            flow_config={"steps": []},
            creator_id=1,
            status=DomainStatus.DRAFT
        )
        db.add(unpublished_domain)

        # 创建一个被拒绝的域
        rejected_domain = models.Domain(
            title="Rejected Domain",
            description="This is a rejected domain",
            flow_config={"steps": []},
            creator_id=1,
            status=DomainStatus.REJECTED
        )
        db.add(rejected_domain)

        db.commit()

        # 调用 get_domains_for_review 函数
        domains = admin.get_domains_for_review(
            current_admin=models.User(id=1, username="admin", role=models.UserRole.ADMIN),
            db=db
        )

        # 验证返回的结果是否包含所有域（包括未发布的）
        assert len(domains) == 3

        # 验证返回的域是否包含已发布的域
        published_domains = [d for d in domains if d.status == DomainStatus.PUBLISHED]
        assert len(published_domains) == 1
        assert published_domains[0].title == "Published Domain"

        # 验证返回的域是否包含未发布的域
        unpublished_domains = [d for d in domains if d.status == DomainStatus.DRAFT]
        assert len(unpublished_domains) == 1
        assert unpublished_domains[0].title == "Unpublished Domain"

        # 验证返回的域是否包含被拒绝的域
        rejected_domains = [d for d in domains if d.status == DomainStatus.REJECTED]
        assert len(rejected_domains) == 1
        assert rejected_domains[0].title == "Rejected Domain"
    finally:
        # 清理资源
        db.close()
