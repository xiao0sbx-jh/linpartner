import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, message } from 'antd';
import { UserOutlined, TeamOutlined, SearchOutlined, BulbOutlined, FireOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { userLogout } from '../api/user';

const { Header, Content, Footer } = Layout;

/**
 * 主布局：顶部导航 + 内容区
 */
export default function BasicLayout({ currentUser, onLogout, refreshCurrentUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/team/list', icon: <TeamOutlined />, label: '队伍广场' },
    { key: '/user/search', icon: <SearchOutlined />, label: '找伙伴' },
    { key: '/user/match', icon: <BulbOutlined />, label: '智能匹配' },
    { key: '/user/recommend', icon: <FireOutlined />, label: '推荐用户' },
    { key: '/team/my/create', label: '我创建的队伍' },
    { key: '/team/my/join', label: '我加入的队伍' },
  ];

  // 高亮当前路由对应的菜单项（详情页也高亮队伍广场）
  const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.key))?.key ?? '';

  const handleMenuClick = ({ key }) => navigate(key);

  const handleLogout = async () => {
    await userLogout();
    message.success('已退出登录');
    onLogout?.();
    navigate('/user/login');
  };

  const userMenuItems = [
    { key: 'profile', label: '个人资料' },
    { key: 'logout', label: '退出登录', danger: true },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'profile') navigate('/user/profile');
    if (key === 'logout') handleLogout();
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <div
          style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            marginRight: 32,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onClick={() => navigate('/team/list')}
        >
          🧑‍🤝‍🧑 伙伴匹配
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Space style={{ marginLeft: 16 }}>
          {currentUser ? (
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
              <Space style={{ cursor: 'pointer', color: '#fff' }}>
                <Avatar size="small" src={currentUser.avatarUrl} icon={<UserOutlined />} />
                <span>{currentUser.username || currentUser.userAccount}</span>
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <a style={{ color: '#fff' }} onClick={() => navigate('/user/login')}>
                登录
              </a>
              <a style={{ color: '#fff' }} onClick={() => navigate('/user/register')}>
                注册
              </a>
            </Space>
          )}
        </Space>
      </Header>

      <Content>
        <div className="page-container">
          <Outlet />
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', color: '#999' }}>伙伴匹配系统 · 学习项目</Footer>
    </Layout>
  );
}
