import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { userLogin } from '../../api/user';

const { Title, Text } = Typography;

/**
 * 登录页
 */
export default function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await userLogin({
        userAccount: values.userAccount,
        userPassword: values.userPassword,
      });
      if (!res.data) {
        message.error('账号或密码错误');
        return;
      }
      message.success('登录成功');
      // 通知 App 刷新全局登录用户
      await onLogin?.();
      navigate('/team/list');
    } catch (e) {
      // 错误提示已由 axios 拦截器统一处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 380, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            🧑‍🤝‍🧑 伙伴匹配
          </Title>
          <Text type="secondary">找到志同道合的伙伴</Text>
        </div>

        <Form name="login" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="userAccount" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="账号（至少 4 位）" />
          </Form.Item>

          <Form.Item name="userPassword" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">还没有账号？</Text>
          <Link to="/user/register"> 立即注册</Link>
        </div>
      </Card>
    </div>
  );
}
