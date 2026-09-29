import React, { useCallback, useEffect, useState } from 'react';
import { Row, Col, Empty, Spin, Typography, Pagination } from 'antd';
import { recommendUsers } from '../../api/user';
import UserCard from '../../components/UserCard';

const { Title, Text } = Typography;

const PAGE_SIZE = 12;

/**
 * 推荐用户：分页浏览所有用户
 * 后端有 Redis 缓存（30 秒），相同的分页参数短时间内会直接走缓存
 */
export default function RecommendPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async (page) => {
    setLoading(true);
    try {
      const res = await recommendUsers(PAGE_SIZE, page);
      // 后端返回的是 MyBatis-Plus 的 Page 对象：{ records, total, current, size }
      setUsers(res.data?.records ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (e) {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(pageNum);
  }, [pageNum, loadUsers]);

  return (
    <div>
      <Title level={4}>推荐用户</Title>
      <Text type="secondary">看看这个平台上还有哪些小伙伴</Text>

      <Spin spinning={loading}>
        {users.length > 0 ? (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {users.map((user) => (
              <Col key={user.id} xs={24} sm={12} md={8} lg={6}>
                <UserCard user={user} />
              </Col>
            ))}
          </Row>
        ) : (
          !loading && <Empty style={{ marginTop: 48 }} description="暂无用户" />
        )}
      </Spin>

      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={pageNum}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPageNum}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
