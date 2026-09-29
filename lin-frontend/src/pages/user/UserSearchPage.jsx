import React, { useState } from 'react';
import { Select, Button, Row, Col, Empty, Card, Spin, Typography } from 'antd';
import { searchUsersByTags } from '../../api/user';
import { PRESET_TAGS } from '../../constants';
import UserCard from '../../components/UserCard';

const { Title, Text } = Typography;

/**
 * 找伙伴：按标签搜索用户
 * 后端要求标签是全匹配（AND），即用户必须包含所有选中的标签
 */
export default function UserSearchPage() {
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (tags.length === 0) return;
    setLoading(true);
    try {
      const res = await searchUsersByTags(tags);
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
      <Title level={4}>找伙伴</Title>
      <Text type="secondary">按标签搜索，结果只会展示同时包含所有选中标签的用户</Text>

      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Select
            mode="tags"
            style={{ flex: 1, minWidth: 260 }}
            value={tags}
            onChange={setTags}
            placeholder="选择或输入标签"
            options={PRESET_TAGS.map((tag) => ({ label: tag, value: tag }))}
            tokenSeparators={[',', '，']}
          />
          <Button type="primary" onClick={handleSearch} disabled={tags.length === 0}>
            搜索
          </Button>
        </div>
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
          searched &&
          !loading && (
            <Empty
              description={
                tags.length === 0 ? '请先选择标签' : '没有找到符合条件的用户，换个标签试试'
              }
            />
          )
        )}
      </Spin>
    </div>
  );
}
