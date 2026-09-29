import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import BasicLayout from './layouts/BasicLayout';
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import UserProfilePage from './pages/user/UserProfilePage';
import UserSearchPage from './pages/user/UserSearchPage';
import MatchPage from './pages/user/MatchPage';
import RecommendPage from './pages/user/RecommendPage';
import TeamListPage from './pages/team/TeamListPage';
import TeamCreatePage from './pages/team/TeamCreatePage';
import TeamDetailPage from './pages/team/TeamDetailPage';
import TeamMyCreatePage from './pages/team/TeamMyCreatePage';
import TeamMyJoinPage from './pages/team/TeamMyJoinPage';
import { getCurrentUser } from './api/user';

/**
 * 应用根组件
 * 负责：主题配置、全局登录用户状态、路由分发
 */
export default function App() {
  // 全局登录用户，null 表示未登录
  const [currentUser, setCurrentUser] = useState(null);
  // 是否还在拉取登录态，避免刷新页面时闪一下登录页
  const [loadingUser, setLoadingUser] = useState(true);

  const refreshCurrentUser = useCallback(async () => {
    try {
      const res = await getCurrentUser();
      setCurrentUser(res.data ?? null);
    } catch (e) {
      // 未登录，保持 null 即可
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  // 未登录时自动跳转到登录页
  const requireLogin = (element) => {
    if (loadingUser) return null;
    if (!currentUser) return <Navigate to="/user/login" replace />;
    return element;
  };

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <Routes>
          <Route path="/user/login" element={<LoginPage onLogin={refreshCurrentUser} />} />
          <Route path="/user/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <BasicLayout
                currentUser={currentUser}
                onLogout={() => setCurrentUser(null)}
                refreshCurrentUser={refreshCurrentUser}
              />
            }
          >
            <Route index element={<Navigate to="/team/list" replace />} />
            <Route path="user/profile" element={requireLogin(<UserProfilePage currentUser={currentUser} />)} />
            <Route path="user/search" element={requireLogin(<UserSearchPage />)} />
            <Route path="user/match" element={requireLogin(<MatchPage />)} />
            <Route path="user/recommend" element={requireLogin(<RecommendPage />)} />
            <Route path="team/list" element={<TeamListPage currentUser={currentUser} />} />
            <Route path="team/create" element={requireLogin(<TeamCreatePage />)} />
            <Route path="team/detail/:id" element={<TeamDetailPage currentUser={currentUser} />} />
            <Route path="team/my/create" element={requireLogin(<TeamMyCreatePage />)} />
            <Route path="team/my/join" element={requireLogin(<TeamMyJoinPage />)} />
          </Route>

          <Route path="*" element={<Navigate to="/team/list" replace />} />
        </Routes>
      </AntdApp>
    </ConfigProvider>
  );
}
