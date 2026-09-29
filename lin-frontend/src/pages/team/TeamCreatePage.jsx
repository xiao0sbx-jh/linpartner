import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select, DatePicker, InputNumber, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { addTeam } from '../../api/team';
import { TEAM_STATUS, TEAM_STATUS_OPTIONS } from '../../constants';
import { toBackendDateTime } from '../../utils/format';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * 创建队伍页
 * 后端校验规则：名称 <= 20 字、描述 <= 512 字、人数 1~20、加密队伍必须有密码（<= 32 位）
 */
export default function TeamCreatePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(TEAM_STATUS.PUBLIC);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await addTeam({
        name: values.name,
        description: values.description,
        maxNum: values.maxNum,
        status: values.status,
        password: values.status === TEAM_STATUS.SECRET ? values.password : undefined,
        // DatePicker 返回 dayjs 对象，转成后端能解析的字符串
        expireTime: values.expireTime ? toBackendDateTime(values.expireTime.toDate()) : null,
      });
      message.success('队伍创建成功');
      navigate(`/team/detail/${res.data}`);
    } catch (e) {
      // 错误提示已由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Title level={4}>创建队伍</Title>
      <Text type="secondary">你是队长，创建后可以邀请其他伙伴加入</Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 560, marginTop: 16 }}
        initialValues={{
          status: TEAM_STATUS.PUBLIC,
          maxNum: 5,
          expireTime: dayjs().add(7, 'day'),
        }}
      >
        <Form.Item
          label="队伍名称"
          name="name"
          rules={[
            { required: true, message: '请输入队伍名称' },
            { max: 20, message: '队伍名称最多 20 个字' },
          ]}
        >
          <Input placeholder="例如：一起刷算法题" maxLength={20} showCount />
        </Form.Item>

        <Form.Item
          label="队伍描述"
          name="description"
          rules={[{ max: 512, message: '描述最多 512 个字' }]}
        >
          <TextArea
            rows={4}
            placeholder="介绍一下队伍的目标、要求、活动时间等"
            maxLength={512}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="最大人数"
          name="maxNum"
          rules={[{ required: true, message: '请输入最大人数' }]}
        >
          <InputNumber min={1} max={20} style={{ width: 160 }} />
        </Form.Item>

        <Form.Item
          label="队伍状态"
          name="status"
          rules={[{ required: true, message: '请选择队伍状态' }]}
        >
          <Select
            options={TEAM_STATUS_OPTIONS}
            onChange={setStatus}
            style={{ width: 200 }}
          />
        </Form.Item>

        {status === TEAM_STATUS.SECRET && (
          <Form.Item
            label="队伍密码"
            name="password"
            rules={[
              { required: true, message: '加密队伍必须设置密码' },
              { max: 32, message: '密码最多 32 位' },
            ]}
          >
            <Input.Password placeholder="其他人需要凭此密码加入" maxLength={32} />
          </Form.Item>
        )}

        <Form.Item
          label="过期时间"
          name="expireTime"
          rules={[{ required: true, message: '请选择过期时间' }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: 240 }}
            // 只能选择未来的时间，后端会校验过期时间必须大于当前时间
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建队伍
            </Button>
            <Button onClick={() => navigate(-1)}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
