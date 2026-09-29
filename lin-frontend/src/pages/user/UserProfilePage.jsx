import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Select, Space, Divider, Typography } from 'antd';
import { updateUser } from '../../api/user';
import { GENDER_OPTIONS, PRESET_TAGS } from '../../constants';

const { Title, Text } = Typography;

/**
 * 个人资料页
 * 注意：后端 updateUser 要求传完整的 User 对象，所以这里把 id/账号/标签一起提交
 */
export default function UserProfilePage({ currentUser }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    let tags = [];
    try {
      tags = currentUser.tags ? JSON.parse(currentUser.tags) : [];
      if (!Array.isArray(tags)) tags = [];
    } catch (e) {
      tags = [];
    }
    setSelectedTags(tags);
    form.setFieldsValue({
      username: currentUser.username,
      phone: currentUser.phone,
      email: currentUser.email,
      gender: currentUser.gender,
      avatarUrl: currentUser.avatarUrl,
    });
  }, [currentUser, form]);

  const onFinish = async (values) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateUser({
        id: currentUser.id,
        // 提交 tags 时必须序列化成 JSON 字符串，后端存储的就是字符串
        tags: JSON.stringify(selectedTags),
        username: values.username,
        phone: values.phone,
        email: values.email,
        gender: values.gender,
        userAccount: currentUser.userAccount,
      });
      message.success('保存成功，刷新后生效');
    } catch (e) {
      // 错误提示已由拦截器处理
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <Title level={4}>个人资料</Title>
      <Text type="secondary">
        账号 {currentUser?.userAccount} · 星球编号 {currentUser?.planetCode ?? '未设置'}
      </Text>

      <Divider />

      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 520 }}>
        <Form.Item label="昵称" name="username">
          <Input placeholder="给自己起个昵称" maxLength={20} />
        </Form.Item>

        <Form.Item label="性别" name="gender">
          <Select options={GENDER_OPTIONS} placeholder="请选择" allowClear />
        </Form.Item>

        <Form.Item label="电话" name="phone">
          <Input placeholder="联系电话" />
        </Form.Item>

        <Form.Item label="邮箱" name="email">
          <Input placeholder="邮箱地址" />
        </Form.Item>

        <Form.Item label="头像地址" name="avatarUrl">
          <Input placeholder="填写一个图片 URL" />
        </Form.Item>

        <Form.Item label="我的标签">
          <Select
            mode="tags"
            value={selectedTags}
            onChange={setSelectedTags}
            placeholder="选择或输入标签，按回车添加"
            options={PRESET_TAGS.map((tag) => ({ label: tag, value: tag }))}
            tokenSeparators={[',', '，']}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            标签越准确，智能匹配的结果越靠谱
          </Text>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
