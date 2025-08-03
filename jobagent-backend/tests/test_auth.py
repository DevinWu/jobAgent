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