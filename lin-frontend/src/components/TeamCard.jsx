import React from 'react';
import { Card, Tag, Space, Typography, Button, Avatar } from 'antd';
import { TeamOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { TEAM_STATUS, TEAM_STATUS_TEXT } from '../constants';
import { formatDateTime } from '../utils/format';

const { Text, Paragraph } = Typography;

const STATUS_COLOR = {
  [TEAM_STATUS.PUBLIC]: 'green',
  [TEAM_STATUS.PRIVATE]: 'orange',
  [TEAM_STATUS.SECRET]: 'red',
};

/**
 * 队伍卡片
 * @param {object} team 后端返回的 TeamUserVO
 * @param {React.ReactNode} extra 右上角附加操作（如「退出队伍」按钮）
 */
export default function TeamCard({ team, extra }) {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      style={{ height: '100%' }}
      onClick={() => navigate(`/team/detail/${team.id}`)}
      extra={
        // 阻止冒泡，否则点按钮会同时触发卡片跳转
        extra ? <div onClick={(e) => e.stopPropagation()}>{extra}</div> : null
      }
      title={
        <Space>
          <TeamOutlined />
          <span>{team.name}</span>
          <Tag color={STATUS_COLOR[team.status]}>
            {TEAM_STATUS_TEXT[team.status] ?? '未知'}
          </Tag>
          {team.hasJoin && <Tag color="blue">已加入</Tag>}
        </Space>
      }
    >
      <Paragraph
        type="secondary"
        ellipsis={{ rows: 2 }}
        style={{ minHeight: 44, marginBottom: 12 }}
      >
        {team.description || '暂无描述'}
      </Paragraph>

      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <UserOutlined /> 人数：{team.hasJoinNum ?? 0} / {team.maxNum}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ClockCircleOutlined /> 过期：{team.expireTime ? formatDateTime(team.expireTime) : '永不过期'}
        </Text>
      </Space>

      {team.createUser && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Avatar size="small" src={team.createUser.avatarUrl} icon={<UserOutlined />} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            队长：{team.createUser.username || team.createUser.userAccount}
          </Text>
        </div>
      )}
    </Card>
  );
}
