import request from './request';

/**
 * 用户注册
 * @param {{userAccount: string, userPassword: string, checkPassword: string, planetCode: string}} params
 */
export async function userRegister(params) {
  return request.post('/user/register', params);
}

/**
 * 用户登录
 */
export async function userLogin(params) {
  return request.post('/user/login', params);
}

/**
 * 用户注销
 */
export async function userLogout() {
  return request.post('/user/logout');
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser() {
  return request.post('/user/current');
}

/**
 * 更新用户信息
 */
export async function updateUser(user) {
  return request.post('/user/update', user);
}

/**
 * 根据标签搜索用户
 * 注意后端用 @RequestParam 接收 List<String>，所以要用数组形式的 query 参数
 */
export async function searchUsersByTags(tagNameList) {
  const params = new URLSearchParams();
  tagNameList.forEach((tag) => params.append('tagNameList', tag));
  return request.post(`/user/search/tag?${params.toString()}`);
}

/**
 * 分页获取推荐用户
 */
export async function recommendUsers(pageSize = 10, pageNum = 1) {
  return request.get('/user/recommend', {
    params: { pageSize, pageNum },
  });
}

/**
 * 匹配最相似的用户
 * @param {number} num 匹配数量，后端要求 0 < num < 20
 */
export async function matchUsers(num) {
  return request.get('/user/match', { params: { num } });
}

/**
 * 管理员：根据昵称搜索用户
 */
export async function searchUsers(username) {
  return request.post('/user/search', null, { params: { username } });
}

/**
 * 管理员：删除用户
 */
export async function deleteUser(id) {
  return request.post('/user/delete', id);
}
