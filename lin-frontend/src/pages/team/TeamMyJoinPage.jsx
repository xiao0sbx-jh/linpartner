import React, { useCallback, useEffect, useState } from 'react';
import { Row, Col, Empty, Spin, Typography, Button, message, Popconfirm, Card } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listMyJoinTeams, quitTeam } from '../../api/team';
import TeamCard from '../../components/TeamCard';

const { Title, Text } = Typography;

/**
 * 我加入的队伍
 */
export default function TeamMyJoinPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listMyJoinTeams();
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

  const handleQuit = async (teamId) => {
    await quitTeam({ teamId });
    message.success('已退出队伍');
    loadTeams();
  };

  return (
    <div>
      <Title level={4}>我加入的队伍</Title>
      <Text type="secondary">在这里可以看到你加入（含自己创建）的所有队伍</Text>

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
                        title="确定退出这个队伍吗？"
                        onConfirm={() => handleQuit(team.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button size="small" icon={<LogoutOutlined />}>
                          退出
                        </Button>
                      </Popconfirm>
                    }
                  />
                </Col>
              ))}
            </Row>
          ) : (
            !loading && (
              <Card>
                <Empty description="你还没有加入任何队伍">
                  <Button type="primary" onClick={() => navigate('/team/list')}>
                    去队伍广场看看
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
