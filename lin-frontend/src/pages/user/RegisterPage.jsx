import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { userRegister } from '../../api/user';

const { Title, Text } = Typography;

/**
 * 注册页
 */
export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await userRegister({
        userAccount: values.userAccount,
        userPassword: values.userPassword,
        checkPassword: values.checkPassword,
        planetCode: values.planetCode,
      });
      // 后端注册失败时会返回 -1
      if (res.data === -1 || res.data == null) {
        message.error('注册失败，请检查输入');
        return;
      }
      message.success('注册成功，快去登录吧');
      navigate('/user/login');
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
      <Card style={{ width: 400, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            注册账号
          </Title>
          <Text type="secondary">加入伙伴匹配，寻找你的队友</Text>
        </div>

        <Form name="register" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item
            name="userAccount"
            rules={[
              { required: true, message: '请输入账号' },
              { min: 4, message: '账号至少 4 位' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="账号（至少 4 位）" />
          </Form.Item>

          <Form.Item
            name="userPassword"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 4, message: '密码至少 4 位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码（至少 4 位）" />
          </Form.Item>

          <Form.Item
            name="checkPassword"
            dependencies={['userPassword']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('userPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>

          <Form.Item
            name="planetCode"
            rules={[
              { required: true, message: '请输入星球编号' },
              { max: 5, message: '星球编号最多 5 位' },
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="星球编号（最多 5 位，不可重复）" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">已有账号？</Text>
          <Link to="/user/login"> 去登录</Link>
        </div>
      </Card>
    </div>
  );
}
