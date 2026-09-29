import React, { useCallback, useEffect, useState } from 'react';
import {
  Row,
  Col,
  Empty,
  Spin,
  Typography,
  Input,
  Select,
  Button,
  Card,
  Space,
  message,
  Modal,
  Form,
} from 'antd';
import { PlusOutlined, SearchOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listTeams, joinTeam } from '../../api/team';
import { TEAM_STATUS, TEAM_STATUS_OPTIONS } from '../../constants';
import TeamCard from '../../components/TeamCard';

const { Title } = Typography;

/**
 * 队伍广场：浏览、搜索、加入队伍
 */
export default function TeamListPage({ currentUser }) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState(undefined);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [pendingTeam, setPendingTeam] = useState(null);
  const [joinForm] = Form.useForm();

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTeams({
        searchText: searchText || undefined,
        status,
      });
      setTeams(res.data ?? []);
    } catch (e) {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, status]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const requireLogin = () => {
    if (!currentUser) {
      message.warning('请先登录');
      navigate('/user/login');
      return false;
    }
    return true;
  };

  const handleJoinClick = (team) => {
    if (!requireLogin()) return;
    setPendingTeam(team);
    // 加密队伍需要先输入密码；公开队伍也走同一个接口
    joinForm.resetFields();
    setJoinModalOpen(true);
  };

  const handleJoinConfirm = async () => {
    try {
      const values = await joinForm.validateFields();
      await joinTeam({
        teamId: pendingTeam.id,
        password: values.password || undefined,
      });
      message.success('加入成功');
      setJoinModalOpen(false);
      loadTeams();
    } catch (e) {
      // 校验失败或接口报错，保持弹窗
    }
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
        <Title level={4} style={{ margin: 0 }}>
          队伍广场
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => (requireLogin() ? navigate('/team/create') : null)}
        >
          创建队伍
        </Button>
      </div>

      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索队伍名称或描述"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={loadTeams}
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="队伍状态"
            value={status}
            onChange={setStatus}
            options={TEAM_STATUS_OPTIONS}
            style={{ width: 140 }}
            allowClear
          />
          <Button type="primary" onClick={loadTeams}>
            查询
          </Button>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {teams.length > 0 ? (
          <Row gutter={[16, 16]}>
            {teams.map((team) => (
              <Col key={team.id} xs={24} sm={12} md={8} lg={6}>
                <TeamCard
                  team={team}
                  extra={
                    !team.hasJoin && (
                      <Button size="small" type="primary" ghost onClick={() => handleJoinClick(team)}>
                        加入
                      </Button>
                    )
                  }
                />
              </Col>
            ))}
          </Row>
        ) : (
          !loading && <Empty style={{ marginTop: 48 }} description="暂无队伍，快去创建一个吧" />
        )}
      </Spin>

      <Modal
        title={`加入队伍：${pendingTeam?.name ?? ''}`}
        open={joinModalOpen}
        onOk={handleJoinConfirm}
        onCancel={() => setJoinModalOpen(false)}
        okText="确认加入"
        cancelText="取消"
      >
        {pendingTeam?.status === TEAM_STATUS.SECRET && (
          <p style={{ color: '#faad14' }}>
            <LockOutlined /> 这是一个加密队伍，需要输入正确密码才能加入
          </p>
        )}
        <Form form={joinForm} layout="vertical">
          <Form.Item
            label="队伍密码"
            name="password"
            rules={
              pendingTeam?.status === TEAM_STATUS.SECRET
                ? [{ required: true, message: '请输入队伍密码' }]
                : []
            }
          >
            <Input.Password placeholder="公开队伍可不填" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
