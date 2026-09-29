import axios from 'axios';
import { message } from 'antd';

/**
 * axios 实例
 * 后端 context-path 是 /api，所以 baseURL 设为 /api，
 * 再由 vite 的 proxy 转发到 http://localhost:8080
 */
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  // 关键：带上 cookie，否则后端 session 里的登录态拿不到
  withCredentials: true,
});

// 响应拦截器：统一处理后端的 BaseResponse 结构
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 后端约定 code === 0 表示成功
    if (res.code === 0) {
      return res;
    }
    // 40100 = 未登录，跳转登录页
    if (res.code === 40100) {
      message.error('请先登录');
      // 避免在登录页反复跳转
      if (!window.location.pathname.includes('/user/login')) {
        window.location.href = '/user/login';
      }
      return Promise.reject(new Error(res.message || '未登录'));
    }
    message.error(res.message || '请求失败');
    return Promise.reject(new Error(res.message || '请求失败'));
  },
  (error) => {
    message.error('网络异常，请检查后端服务是否启动');
    return Promise.reject(error);
  },
);

export default request;
