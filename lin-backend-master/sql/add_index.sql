-- ============================================================
-- 索引优化脚本
--
-- 背景：
--   数据量上来后（队伍 4000+、用户 50000+），队伍广场和找伙伴变慢。
--   原因是查询条件涉及的列没有索引，MySQL 走全表扫描 + filesort。
--
-- 用 EXPLAIN 能看到改造前的执行计划：
--   type=ALL（全表扫描）、Extra=Using filesort（需要额外排序）
--
-- 执行方式：
--   mysql -uroot -p123456 partner < sql/add_index.sql
--
-- 说明：索引不是越多越好，每个索引都会拖慢写入。这里只加确实被查询用到的。
-- ============================================================

USE partner;

-- ------------------------------------------------------------
-- team 表
-- ------------------------------------------------------------

-- 队伍广场的主查询：WHERE status = ? AND (expireTime > ? OR expireTime IS NULL)
--                     ORDER BY createTime DESC, id DESC
-- 把 status 和 createTime 放在一个联合索引里，让过滤和排序都能用上索引
CREATE INDEX idx_team_status_create ON team (status, createTime);

-- 过期时间过滤。单列索引在 expireTime IS NULL 条件下也能生效
CREATE INDEX idx_team_expire ON team (expireTime);

-- "我创建的队伍"：WHERE userId = ?
CREATE INDEX idx_team_user ON team (userId);

-- 按名称模糊搜索：LIKE 'xxx%' 能用上索引（LIKE '%xxx%' 不能）
CREATE INDEX idx_team_name ON team (name);


-- ------------------------------------------------------------
-- user_team 表
-- ------------------------------------------------------------

-- 判断"我是否已加入队伍"：WHERE userId = ? AND teamId IN (...)
-- 以及统计队伍人数：WHERE teamId = ?
-- 这两个是最高频的查询，联合索引命中率最高
CREATE INDEX idx_ut_user_team ON user_team (userId, teamId);
CREATE INDEX idx_ut_team ON user_team (teamId);


-- ------------------------------------------------------------
-- user 表
-- ------------------------------------------------------------

-- 登录查询：WHERE userAccount = ? AND userPassword = ?
CREATE INDEX idx_user_account ON user (userAccount);

-- 星球编号唯一性校验：WHERE planetCode = ?
CREATE INDEX idx_user_planet ON user (planetCode);


-- ============================================================
-- 验证：改造后的执行计划
-- type 应该不再是 ALL，Extra 里不应再有 Using filesort
-- ============================================================
SELECT '队伍广场查询的执行计划' AS 说明;
EXPLAIN SELECT * FROM team
WHERE status = 0 AND (expireTime > NOW() OR expireTime IS NULL)
ORDER BY createTime DESC, id DESC LIMIT 12;

SELECT '我加入的队伍的执行计划' AS 说明;
EXPLAIN SELECT * FROM user_team WHERE userId = 1 AND teamId IN (1, 2, 3);

SELECT '登录查询的执行计划' AS 说明;
EXPLAIN SELECT * FROM user WHERE userAccount = 'xiaolin';

-- 查看所有索引
SELECT '当前索引列表' AS 说明;
SELECT TABLE_NAME AS 表名, INDEX_NAME AS 索引名, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS 包含列
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'partner'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;
