import request from './request';

/**
 * 创建队伍
 * @param {{name, description, maxNum, expireTime, status, password}} params
 */
export async function addTeam(params) {
  return request.post('/team/add', params);
}

/**
 * 更新队伍
 */
export async function updateTeam(params) {
  return request.post('/team/update', params);
}

/**
 * 删除队伍（只有队长或管理员可以删）
 */
export async function deleteTeam(id) {
  return request.post('/team/delete', { id });
}

/**
 * 根据 id 获取队伍详情
 */
export async function getTeamById(id) {
  return request.get('/team/get', { params: { id } });
}

/**
 * 分页查询队伍列表
 * 返回结构：{ records, total, current, size }
 * @param {object} params 支持 name/description/searchText/maxNum/status/pageNum/pageSize
 */
export async function listTeams(params = {}) {
  return request.get('/team/list', { params });
}

/**
 * 查询单个队伍（不受分页影响）
 * 用于队伍详情页，避免因为没有分页参数而查不到数据
 */
export async function listTeamsById(id) {
  return request.get('/team/list', { params: { id, pageNum: 1, pageSize: 1 } });
}

/**
 * 分页查询队伍（分页接口）
 */
export async function listTeamsByPage(params = {}) {
  return request.get('/team/list/page', { params });
}

/**
 * 加入队伍
 * @param {{teamId, password}} params
 */
export async function joinTeam(params) {
  return request.post('/team/join', params);
}

/**
 * 退出队伍
 * @param {{teamId}} params
 */
export async function quitTeam(params) {
  return request.post('/team/quit', params);
}

/**
 * 获取我创建的队伍
 */
export async function listMyCreateTeams(params = {}) {
  return request.get('/team/list/my/create', { params });
}

/**
 * 获取我加入的队伍
 */
export async function listMyJoinTeams(params = {}) {
  return request.get('/team/list/my/join', { params });
}
