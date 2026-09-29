import React, { useState } from 'react';
import { Button, Row, Col, Empty, Card, Spin, Typography, InputNumber, Space, Alert } from 'antd';
import { matchUsers } from '../../api/user';
import UserCard from '../../components/UserCard';

const { Title, Text } = Typography;

/**
 * 智能匹配：基于标签编辑距离计算相似度
 * 前提：当前用户必须先在「个人资料」里设置标签
 */
export default function MatchPage() {
  const [num, setNum] = useState(10);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleMatch = async () => {
    setLoading(true);
    try {
      const res = await matchUsers(num);
      setUsers(res.data ?? []);
    } catch (e) {
      setUsers([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div>
      <Title level={4}>智能匹配</Title>
      <Text type="secondary">
        根据你的标签，用编辑距离算法计算相似度，推荐最像你的伙伴
      </Text>

      <Alert
        style={{ marginTop: 16, marginBottom: 16 }}
        type="info"
        showIcon
        message="没有结果？请先到「个人资料」页设置你的标签"
      />

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>匹配数量：</span>
          <InputNumber min={1} max={19} value={num} onChange={setNum} />
          <Button type="primary" onClick={handleMatch}>
            开始匹配
          </Button>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {users.length > 0 ? (
          <Row gutter={[16, 16]}>
            {users.map((user) => (
              <Col key={user.id} xs={24} sm={12} md={8} lg={6}>
                <UserCard user={user} />
              </Col>
            ))}
          </Row>
        ) : (
          searched && !loading && <Empty description="没有匹配到用户" />
        )}
      </Spin>
    </div>
  );
}
