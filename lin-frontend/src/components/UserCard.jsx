import React from 'react';
import { Card, Avatar, Tag, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { GENDER_TEXT } from '../constants';

const { Text } = Typography;

/**
 * 用户信息卡片
 * 后端返回的 tags 是 JSON 字符串（如 ["Java","前端"]），需要先解析
 */
export default function UserCard({ user, extra }) {
  let tags = [];
  try {
    if (user.tags) {
      tags = JSON.parse(user.tags);
      if (!Array.isArray(tags)) tags = [];
    }
  } catch (e) {
    tags = [];
  }

  return (
    <Card hoverable style={{ height: '100%' }} extra={extra}>
      <Card.Meta
        avatar={<Avatar size={56} src={user.avatarUrl} icon={<UserOutlined />} />}
        title={
          <Space>
            <span>{user.username || '未设置昵称'}</span>
            {user.gender != null && (
              <Tag color={user.gender === 1 ? 'blue' : 'pink'}>{GENDER_TEXT[user.gender]}</Tag>
            )}
          </Space>
        }
        description={
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              账号：{user.userAccount}
              {user.planetCode ? ` · 编号：${user.planetCode}` : ''}
            </Text>
            <div style={{ marginTop: 8 }}>
              {tags.length > 0 ? (
                <Space size={[4, 4]} wrap>
                  {tags.map((tag) => (
                    <Tag key={tag} color="processing">
                      {tag}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  暂无标签
                </Text>
              )}
            </div>
          </div>
        }
      />
    </Card>
  );
}
