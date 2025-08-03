from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User, Base
from app.crud import create_admin_user
from app.auth import verify_password

# 在运行测试前创建数据库表
Base.metadata.create_all(bind=engine)


def test_create_admin_user():
    """
    测试create_admin_user函数

    步骤:
    1. 删除数据库中的admin账号（如果存在）
    2. 使用create_admin_user函数创建admin账号
    3. 验证是否能用密码"test1234"成功登录
    """
    # 获取数据库会话
    db: Session = SessionLocal()

    try:
        # 1. 删除数据库中的admin账号（如果存在）
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            print(f"删除现有admin用户: {admin_user.username}")
            db.delete(admin_user)
            db.commit()

        # 2. 使用create_admin_user函数创建admin账号
        new_admin = create_admin_user(db)
        print(f"创建新admin用户: {new_admin.username}")

        # 3. 验证是否能用密码"test1234"成功登录
        # 从数据库重新获取admin用户，确保我们使用的是最新数据
        admin_from_db = db.query(User).filter(User.username == "admin").first()
        assert admin_from_db is not None, "admin用户应该存在于数据库中"

        # 验证密码是否正确
        is_password_correct = verify_password("test1234", admin_from_db.hashed_password)
        assert is_password_correct, "admin用户应该能够使用密码'test1234'登录"

        print("测试通过: admin用户创建成功，并且可以使用密码'test1234'登录")

    finally:
        # 清理资源
        db.close()


def test_create_admin_user_idempotent():
    """
    测试create_admin_user函数的幂等性

    步骤:
    1. 确保admin账号存在
    2. 再次调用create_admin_user函数
    3. 验证admin账号没有被重置（密码仍然是"test1234"）
    """
    # 获取数据库会话
    db: Session = SessionLocal()

    try:
        # 1. 确保admin账号存在
        first_admin = create_admin_user(db)
        original_password_hash = first_admin.hashed_password

        # 2. 再次调用create_admin_user函数
        second_admin = create_admin_user(db)

        # 3. 验证返回的是同一个admin账号（ID相同）
        assert first_admin.id == second_admin.id, "两次调用create_admin_user应该返回同一个用户"

        # 4. 验证密码哈希没有改变
        assert original_password_hash == second_admin.hashed_password, "admin用户的密码哈希不应该改变"

        # 5. 验证密码仍然是"test1234"
        is_password_correct = verify_password("test1234", second_admin.hashed_password)
        assert is_password_correct, "admin用户应该能够使用密码'test1234'登录"

        print("测试通过: create_admin_user函数具有幂等性，多次调用不会重置admin账号")

    finally:
        # 清理资源
        db.close()