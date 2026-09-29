/**
 * 队伍状态枚举，与后端 TeamStatusEnum 保持一致
 */
export const TEAM_STATUS = {
  PUBLIC: 0,
  PRIVATE: 1,
  SECRET: 2,
};

export const TEAM_STATUS_TEXT = {
  0: '公开',
  1: '私有',
  2: '加密',
};

export const TEAM_STATUS_OPTIONS = [
  { label: '公开', value: TEAM_STATUS.PUBLIC },
  { label: '私有', value: TEAM_STATUS.PRIVATE },
  { label: '加密', value: TEAM_STATUS.SECRET },
];

/**
 * 性别枚举，与数据库 gender 字段对应
 */
export const GENDER_OPTIONS = [
  { label: '男', value: 1 },
  { label: '女', value: 0 },
];

export const GENDER_TEXT = {
  0: '女',
  1: '男',
};

/**
 * 常用标签，供用户资料页和标签搜索页选择
 */
export const PRESET_TAGS = [
  'Java',
  'C++',
  'Python',
  '前端',
  '后端',
  '全栈',
  '算法',
  '数据结构',
  'Spring',
  'MySQL',
  'Redis',
  'Linux',
  '竞赛',
  '考研',
  '保研',
  '实习',
  '校招',
  '读研',
  '大厂',
  '创业',
];
