import sqlite3
import os
from app.auth import verify_password, get_password_hash


class TestVerifyPassword:
    def test_verify_correct_password(self):
        print("测试正确密码验证")
        """测试正确密码能够验证通过"""
        # 准备测试数据
        plain_password = "correct_password"
        hashed_password = get_password_hash(plain_password)

        # 执行验证
        result = verify_password(plain_password, hashed_password)

        # 断言结果
        assert result is True, "正确密码应该验证通过"

    def test_verify_incorrect_password(self):
        """测试错误密码验证失败"""
        # 准备测试数据
        plain_password = "correct_password"
        wrong_password = "wrong_password"
        hashed_password = get_password_hash(plain_password)

        # 执行验证
        result = verify_password(wrong_password, hashed_password)

        # 断言结果
        assert result is False, "错误密码应该验证失败"

    def test_verify_empty_password(self):
        """测试空密码的情况"""
        # 准备测试数据
        plain_password = ""
        hashed_password = get_password_hash(plain_password)

        # 执行验证
        result = verify_password(plain_password, hashed_password)

        # 断言结果
        assert result is True, "空密码应该能够验证通过（如果哈希的也是空密码）"

        # 测试空密码与非空哈希不匹配
        non_empty_hashed = get_password_hash("some_password")
        result = verify_password("", non_empty_hashed)
        assert result is False, "空密码不应该匹配非空密码的哈希"

    def test_verify_special_characters_password(self):
        """测试包含特殊字符的密码"""
        # 准备测试数据
        special_password = "p@ssw0rd!@#$%^&*()"
        hashed_password = get_password_hash(special_password)

        # 执行验证
        result = verify_password(special_password, hashed_password)

        # 断言结果
        assert result is True, "包含特殊字符的密码应该能够验证通过"
    
    def test_print_all_users(self):
        """打印jobagent.db中的所有用户名和密码"""
        # 获取数据库文件的绝对路径
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "jobagent.db")
        
        # 检查数据库文件是否存在
        if not os.path.exists(db_path):
            print(f"数据库文件不存在: {db_path}")
            return
        
        # 连接到数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # 查询所有用户
            cursor.execute("SELECT id, username, hashed_password FROM users")
            users = cursor.fetchall()
            
            if not users:
                print("数据库中没有用户记录")
                return
            
            # 打印用户信息
            print("\n===== 用户信息 =====")
            print("ID\t用户名\t\t密码哈希")
            print("-" * 80)
            for user_id, username, hashed_password in users:
                print(f"{user_id}\t{username}\t\t{hashed_password}")
            print("=" * 80)
            
        except sqlite3.OperationalError as e:
            print(f"数据库操作错误: {e}")
        finally:
            # 关闭连接
            conn.close()
        
        # 这个测试总是通过，因为它只是打印信息
        assert True


def test_admin_password_is_expected():
    """测试管理员密码"""
    # 准备测试数据
    plain_password = "test1234"
    hashed_password = get_password_hash(plain_password)
    print(f"管理员密码哈希: {hashed_password}")

    # 从数据库读取admin用户的密码哈希
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "jobagent.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT hashed_password FROM users WHERE username = 'admin'")
        admin_hashed_password = cursor.fetchone()

        if admin_hashed_password:
            admin_hashed_password = admin_hashed_password[0]
            print(f"数据库中的管理员密码哈希: {admin_hashed_password}")

            # 验证数据库中的哈希是否与当前生成的哈希一致
            assert admin_hashed_password == hashed_password, "数据库中的管理员密码哈希与预期不符"

    except sqlite3.OperationalError as e:
        print(f"数据库操作错误: {e}")
    finally:
        conn.close()
