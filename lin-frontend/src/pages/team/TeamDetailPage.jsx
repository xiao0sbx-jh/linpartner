import React, { useCallback, useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Avatar,
  List,
  Typography,
  Empty,
  Popconfirm,
  DatePicker,
  Select,
  InputNumber,
  Result,
} from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getTeamById, joinTeam, quitTeam, deleteTeam, updateTeam, listTeams } from '../../api/team';
import { TEAM_STATUS, TEAM_STATUS_TEXT, TEAM_STATUS_OPTIONS } from '../../constants';
import { formatDateTime, toBackendDateTime } from '../../utils/format';

const { Title, Text } = Typography;

const STATUS_COLOR = {
  [TEAM_STATUS.PUBLIC]: 'green',
  [TEAM_STATUS.PRIVATE]: 'orange',
  [TEAM_STATUS.SECRET]: 'red',
};

/**
 * 队伍详情页
 * 展示队伍信息、成员列表，并根据当前用户身份提供：加入 / 退出 / 编辑 / 解散
 */
export default function TeamDetailPage({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [joinForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTeamById(id);
      setTeam(res.data);
      // 通过 listTeams 拿 hasJoin / hasJoinNum（get 接口不返回这些字段）
      const listRes = await listTeams({ id });
      const detail = listRes.data?.[0];
      if (detail) {
        setTeam((prev) => ({ ...prev, ...detail }));
      }
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  /**
   * 加载成员列表
   * 后端没有提供「按队伍查成员」的独立接口，
   * 这里用 /team/list/my/join 无法覆盖所有队伍，因此成员信息只能从队伍卡片的 hasJoinNum 得知。
   * 为保持功能完整，这里展示队长的信息 + 已知人数。
   */
  useEffect(() => {
    if (team?.createUser) {
      setMembers([team.createUser]);
    } else if (team?.userId) {
      setMembers([]);
    }
  }, [team]);

  const isLeader = currentUser && team && currentUser.id === team.userId;
  const isAdmin = currentUser?.userRole === 1;
  const canManage = isLeader || isAdmin;

  const requireLogin = () => {
    if (!currentUser) {
      message.warning('请先登录');
      navigate('/user/login');
      return false;
    }
    return true;
  };

  const handleJoin = async () => {
    if (!requireLogin()) return;
    setJoinModalOpen(true);
    joinForm.resetFields();
  };

  const confirmJoin = async () => {
    try {
      const values = await joinForm.validateFields();
      await joinTeam({ teamId: team.id, password: values.password || undefined });
      message.success('加入成功');
      setJoinModalOpen(false);
      loadTeam();
    } catch (e) {
      // 保持弹窗
    }
  };

  const handleQuit = async () => {
    await quitTeam({ teamId: team.id });
    message.success('已退出队伍');
    navigate('/team/list');
  };

  const handleDelete = async () => {
    await deleteTeam(team.id);
    message.success('队伍已解散');
    navigate('/team/list');
  };

  const openEditModal = () => {
    editForm.setFieldsValue({
      name: team.name,
      description: team.description,
      maxNum: team.maxNum,
      status: team.status,
      expireTime: team.expireTime ? dayjs(team.expireTime) : null,
    });
    setEditModalOpen(true);
  };

  const confirmEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await updateTeam({
        id: team.id,
        name: values.name,
        description: values.description,
        maxNum: values.maxNum,
        status: values.status,
        password: values.password || undefined,
        expireTime: values.expireTime ? toBackendDateTime(values.expireTime.toDate()) : null,
      });
      message.success('修改成功');
      setEditModalOpen(false);
      loadTeam();
    } catch (e) {
      // 保持弹窗
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notFound || !team) {
    return (
      <Result
        status="404"
        title="队伍不存在"
        subTitle="可能已被解散，或链接有误"
        extra={
          <Button type="primary" onClick={() => navigate('/team/list')}>
            返回队伍广场
          </Button>
        }
      />
    );
  }

  const isFull = (team.hasJoinNum ?? 0) >= team.maxNum;

  return (
    <div>
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <Space align="center" wrap>
              <Title level={4} style={{ margin: 0 }}>
                {team.name}
              </Title>
              <Tag color={STATUS_COLOR[team.status]}>
                {TEAM_STATUS_TEXT[team.status] ?? '未知'}
              </Tag>
              {isLeader && <Tag color="gold">我是队长</Tag>}
            </Space>
          </div>

          <Space>
            {!team.hasJoin && (
              <Button type="primary" onClick={handleJoin} disabled={isFull || team.status === TEAM_STATUS.PRIVATE}>
                {isFull ? '队伍已满' : '加入队伍'}
              </Button>
            )}
            {team.hasJoin && (
              <Popconfirm
                title="确定退出这个队伍吗？"
                description={isLeader ? '你是队长，退出后队长会自动转让给最早加入的成员' : undefined}
                onConfirm={handleQuit}
                okText="确定退出"
                cancelText="取消"
              >
                <Button icon={<LogoutOutlined />}>退出队伍</Button>
              </Popconfirm>
            )}
            {canManage && (
              <>
                <Button icon={<EditOutlined />} onClick={openEditModal}>
                  编辑
                </Button>
                <Popconfirm
                  title="确定解散这个队伍吗？"
                  description="解散后所有成员的关联关系都会被删除，不可恢复"
                  onConfirm={handleDelete}
                  okText="确定解散"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    解散
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        </div>

        <Descriptions column={{ xs: 1, sm: 2 }} style={{ marginTop: 24 }} bordered>
          <Descriptions.Item label="队伍描述" span={2}>
            {team.description || '暂无描述'}
          </Descriptions.Item>
          <Descriptions.Item label="当前人数">
            {team.hasJoinNum ?? 0} / {team.maxNum}
          </Descriptions.Item>
          <Descriptions.Item label="过期时间">
            {team.expireTime ? formatDateTime(team.expireTime) : '永不过期'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDateTime(team.createTime)}
          </Descriptions.Item>
          <Descriptions.Item label="是否已加入">
            {team.hasJoin ? '已加入' : '未加入'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 16 }} title="队长信息">
        {team.createUser ? (
          <List
            dataSource={[team.createUser]}
            renderItem={(user) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={user.avatarUrl} icon={<UserOutlined />} />}
                  title={user.username || user.userAccount}
                  description={
                    <Space size={[4, 4]} wrap>
                      {user.planetCode && <Tag>编号 {user.planetCode}</Tag>}
                      {user.gender != null && <Tag color={user.gender === 1 ? 'blue' : 'pink'}>
                        {user.gender === 1 ? '男' : '女'}
                      </Tag>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无队长信息" />
        )}
        <Text type="secondary" style={{ fontSize: 12 }}>
          提示：后端暂未提供「查询队伍成员列表」的接口，因此这里只展示队长信息
        </Text>
      </Card>

      <Modal
        title="加入队伍"
        open={joinModalOpen}
        onOk={confirmJoin}
        onCancel={() => setJoinModalOpen(false)}
        okText="确认加入"
        cancelText="取消"
      >
        {team.status === TEAM_STATUS.SECRET && (
          <p style={{ color: '#faad14' }}>这是一个加密队伍，需要输入正确密码</p>
        )}
        <Form form={joinForm} layout="vertical">
          <Form.Item
            label="队伍密码"
            name="password"
            rules={team.status === TEAM_STATUS.SECRET ? [{ required: true, message: '请输入密码' }] : []}
          >
            <Input.Password placeholder="公开队伍可不填" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑队伍"
        open={editModalOpen}
        onOk={confirmEdit}
        onCancel={() => setEditModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="队伍名称"
            name="name"
            rules={[
              { required: true, message: '请输入队伍名称' },
              { max: 20, message: '最多 20 个字' },
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
          <Form.Item label="队伍描述" name="description" rules={[{ max: 512, message: '最多 512 个字' }]}>
            <Input.TextArea rows={3} maxLength={512} />
          </Form.Item>
          <Form.Item
            label="最大人数"
            name="maxNum"
            rules={[{ required: true, message: '请输入最大人数' }]}
          >
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="队伍状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={TEAM_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item label="队伍密码（改为加密队伍时必填）" name="password">
            <Input.Password maxLength={32} placeholder="保持原密码可留空" />
          </Form.Item>
          <Form.Item label="过期时间" name="expireTime">
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
