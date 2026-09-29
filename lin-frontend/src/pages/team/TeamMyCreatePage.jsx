import React, { useCallback, useEffect, useState } from 'react';
import { Row, Col, Empty, Spin, Typography, Button, message, Popconfirm, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listMyCreateTeams, deleteTeam } from '../../api/team';
import TeamCard from '../../components/TeamCard';

const { Title, Text } = Typography;

/**
 * 我创建的队伍
 */
export default function TeamMyCreatePage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMyCreateTeams();
      setTeams(res.data ?? []);
    } catch (e) {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleDelete = async (teamId) => {
    await deleteTeam(teamId);
    message.success('队伍已解散');
    loadTeams();
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            我创建的队伍
          </Title>
          <Text type="secondary">你最多可以创建 5 个队伍</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/team/create')}>
          创建队伍
        </Button>
      </div>

      <Spin spinning={loading}>
        <div style={{ marginTop: 16 }}>
          {teams.length > 0 ? (
            <Row gutter={[16, 16]}>
              {teams.map((team) => (
                <Col key={team.id} xs={24} sm={12} md={8} lg={6}>
                  <TeamCard
                    team={team}
                    extra={
                      <Popconfirm
                        title="确定解散这个队伍吗？"
                        description="解散后成员关系会被一并删除"
                        onConfirm={() => handleDelete(team.id)}
                        okText="确定"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    }
                  />
                </Col>
              ))}
            </Row>
          ) : (
            !loading && (
              <Card>
                <Empty description="你还没有创建过队伍">
                  <Button type="primary" onClick={() => navigate('/team/create')}>
                    立即创建
                  </Button>
                </Empty>
              </Card>
            )
          )}
        </div>
      </Spin>
    </div>
  );
}
