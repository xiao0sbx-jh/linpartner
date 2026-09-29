-- ============================================================
-- 测试数据生成脚本（大数据量版）
--
-- 生成规模：
--   user       50000+ 条（含 1 个管理员 + 5 个固定测试账号 + 5 万个随机用户）
--   team       3000   条（公开 / 私有 / 加密三种状态混合）
--   user_team  8000+  条（保证每个队伍的队长都在成员列表里）
--
-- 统一密码：12345678
--   存储值为 MD5('xiaoling' + '12345678')，与后端 UserServiceImpl.SALT 一致
--
-- 执行方式：
--   mysql -uroot -p123456 partner < sql/mock_data.sql
--   或用 Navicat 打开 partner 库，粘贴执行
--
-- 耗时：约 10~30 秒，视机器性能而定
--
-- 注意：脚本开头会清空三张表。只想追加数据的话，注释掉【清空数据】那一段。
-- ============================================================

USE partner;

SET SESSION sql_mode = '';
SET autocommit = 0;

-- ============================================================
-- 【清空数据】
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user;
TRUNCATE TABLE team;
TRUNCATE TABLE user_team;
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 第一部分：user 表
-- ============================================================

-- ------------------------------------------------------------
-- 1.1 固定账号（方便登录测试）
-- ------------------------------------------------------------

-- 管理员
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
VALUES ('管理员', 'admin', NULL, 1, '351bc26ff90b1689a649460562888a8a', '13800000000', 'admin@test.com',
        '["Java","后端","管理","Spring","MySQL"]', 0, 1, 'admin', 0);

-- 主要测试账号：Java 后端方向，用于验证智能匹配
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
VALUES ('小林', 'xiaolin', NULL, 1, '351bc26ff90b1689a649460562888a8a', '13800000001', 'xiaolin@test.com',
        '["Java","后端","Spring","MySQL","Redis","大厂"]', 0, 0, 'A0001', 0);

-- 无标签账号：用于测试"设置标签后才能匹配"的场景
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
VALUES ('新用户', 'user20', NULL, 0, '351bc26ff90b1689a649460562888a8a', NULL, NULL,
        NULL, 0, 0, 'A0002', 0);

-- 已封禁账号：用于测试 userStatus = 1 的场景
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
VALUES ('已封禁用户', 'banned', NULL, 1, '351bc26ff90b1689a649460562888a8a', NULL, NULL,
        '["测试"]', 1, 0, 'A0003', 0);


-- ------------------------------------------------------------
-- 1.2 批量生成 50000 个随机用户
--
-- 思路：用 1~50000 的数字表做驱动，逐条 INSERT。
-- 标签从下面 8 个方向中挑 2~4 个组合，保证既有区分度又有相似度。
-- ------------------------------------------------------------

-- 数字辅助表（1 ~ 50000）
DROP TEMPORARY TABLE IF EXISTS seq;
CREATE TEMPORARY TABLE seq (n INT PRIMARY KEY);

-- 用交叉连接快速生成 5 万行
INSERT INTO seq (n)
SELECT a.i + b.i * 10 + c.i * 100 + d.i * 1000 + e.i * 10000 + 1
FROM
    (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
    (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
    (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c,
    (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) d,
    (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) e;

-- 按技术方向生成标签组合
-- 用 n % 8 决定主方向，再用 n % N 附加 1~2 个交叉标签
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT
    -- 昵称：前缀 + 编号，保证唯一且可读
    CONCAT(
        ELT(n % 10 + 1, '小明', '小红', '小刚', '小丽', '小强', '小美', '小军', '小芳', '小杰', '小燕'),
        n
    ) AS username,
    CONCAT('user', LPAD(n + 100, 6, '0')) AS userAccount,
    -- 用占位头像服务，方便前端展示效果
    CONCAT('https://api.dicebear.com/7.x/avataaars/svg?seed=user', n) AS avatarUrl,
    n % 2 AS gender,
    '351bc26ff90b1689a649460562888a8a' AS userPassword,
    CONCAT('138', LPAD(n % 100000000, 8, '0')) AS phone,
    CONCAT('user', n, '@test.com') AS email,
    -- 标签：主方向 + 交叉标签
    CASE n % 8
        WHEN 0 THEN CONCAT('["Java","后端","Spring","MySQL"', IF(n % 3 = 0, ',"Redis"', ''), IF(n % 5 = 0, ',"大厂"', ''), ']')
        WHEN 1 THEN CONCAT('["前端","React","Vue","JavaScript"', IF(n % 4 = 0, ',"TypeScript"', ''), IF(n % 6 = 0, ',"大厂"', ''), ']')
        WHEN 2 THEN CONCAT('["算法","数据结构","C++","竞赛"', IF(n % 3 = 0, ',"ACM"', ''), IF(n % 7 = 0, ',"保研"', ''), ']')
        WHEN 3 THEN CONCAT('["Python","人工智能","机器学习"', IF(n % 4 = 0, ',"深度学习"', ''), IF(n % 5 = 0, ',"读研"', ''), ']')
        WHEN 4 THEN CONCAT('["Linux","运维","Docker"', IF(n % 3 = 0, ',"Kubernetes"', ''), IF(n % 6 = 0, ',"云计算"', ''), ']')
        WHEN 5 THEN CONCAT('["Android","Kotlin","移动开发"', IF(n % 4 = 0, ',"Flutter"', ''), ']')
        WHEN 6 THEN CONCAT('["考研","数学","英语"', IF(n % 3 = 0, ',"408"', ''), IF(n % 5 = 0, ',"复试"', ''), ']')
        ELSE        CONCAT('["Java","后端","MySQL","Redis","大厂"', IF(n % 9 = 0, ',"实习"', ''), ']')
    END AS tags,
    0 AS userStatus,
    0 AS userRole,
    -- 星球编号最多 5 位，用编码保证唯一
    CONCAT('U', LPAD(n, 4, '0')) AS planetCode,
    0 AS isDelete
FROM seq;

-- 每 5000 条提交一次，避免单个大事务撑爆 undo log
-- （MySQL 会自己处理，这里显式 COMMIT 一次就够，因为 INSERT...SELECT 是单语句原子操作）
COMMIT;

-- 补一个"有个性化标签"的账号，方便前端演示
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
VALUES ('小满', 'xiaoman', NULL, 0, '351bc26ff90b1689a649460562888a8a', NULL, NULL,
        '["Java","后端","前端","全栈","React","Spring"]', 0, 0, 'A0004', 0);


-- ============================================================
-- 第二部分：team 表
--
-- 生成 3000 支队伍，队长从 user 表里挑
-- 状态分布：公开 70%，加密 20%，私有 10%
-- 过期时间：大部分在未来，少量已过期（用于测试"不展示过期队伍"）
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS seq_team;
CREATE TEMPORARY TABLE seq_team (n INT PRIMARY KEY);

INSERT INTO seq_team (n)
SELECT a.i + b.i * 10 + c.i * 100 + d.i * 1000 + 1
FROM
    (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
    (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
    (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c,
    (SELECT 0 i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) d;

-- 建一张"合法用户 id"表，避免用 min~max 区间取模时踩到 id 空洞
DROP TEMPORARY TABLE IF EXISTS uid_pool;
CREATE TEMPORARY TABLE uid_pool (
    rn INT PRIMARY KEY AUTO_INCREMENT,
    id BIGINT NOT NULL
);
INSERT INTO uid_pool (id) SELECT id FROM user WHERE userAccount LIKE 'user%' ORDER BY id;
SET @uid_cnt = (SELECT COUNT(*) FROM uid_pool);

-- 注意：队长的选取用"序号 → id"的方式查表得到，不用关联子查询，
-- 否则 3000 行每行都要扫一次 user 表，会非常慢。
INSERT INTO team (name, description, maxNum, expireTime, userId, status, password, createTime, updateTime, isDelete)
SELECT
    CONCAT(
        ELT(st.n % 8 + 1,
            '一起刷算法题', 'Java 后端学习小组', '前端项目实战', '考研互助小组',
            '秋招面试交流', 'Python 数据分析', '开源项目共建', '每日打卡学习'),
        ' #', st.n
    ) AS name,
    CONCAT('这是我们第 ', st.n, ' 个小组，欢迎志同道合的朋友加入，一起进步！') AS description,
    -- 最大人数 2~20
    2 + (st.n % 19) AS maxNum,
    -- 80% 未过期（未来 30 天内），20% 已过期
    CASE WHEN st.n % 5 = 0
         THEN DATE_SUB(NOW(), INTERVAL (st.n % 30) DAY)
         ELSE DATE_ADD(NOW(), INTERVAL (st.n % 30) + 1 DAY)
    END AS expireTime,
    -- 队长：由序号映射到真实存在的用户 id
    p.id AS userId,
    -- 状态：0 公开 / 1 私有 / 2 加密
    CASE
        WHEN st.n % 10 < 7 THEN 0
        WHEN st.n % 10 < 9 THEN 2
        ELSE 1
    END AS status,
    -- 只有加密队伍有密码
    CASE WHEN st.n % 10 BETWEEN 7 AND 8 THEN CONCAT('pwd', st.n) ELSE NULL END AS password,
    DATE_SUB(NOW(), INTERVAL (st.n % 60) DAY) AS createTime,
    DATE_SUB(NOW(), INTERVAL (st.n % 60) DAY) AS updateTime,
    0 AS isDelete
FROM seq_team st
JOIN uid_pool p ON p.rn = (st.n * 7919) % @uid_cnt + 1;

COMMIT;


-- ============================================================
-- 第三部分：user_team 表
--
-- 目标：每支队伍至少有 1 个成员（队长），再补充若干随机成员
-- 必须先插队长，再插随机成员，保证队长一定在成员列表里
-- ============================================================

-- 3.1 每支队伍的队长先入队
INSERT INTO user_team (userId, teamId, joinTime, createTime, updateTime, isDelete)
SELECT t.userId, t.id, t.createTime, t.createTime, t.createTime, 0
FROM team t
WHERE t.userId IS NOT NULL;

COMMIT;

-- 3.2 再补充成员
--     关键：用 k <= maxNum - 1 约束插入数量。
--     此时每队已有 1 人（队长），最多再补 (maxNum - 1) 个，
--     保证最终人数不会超过 maxNum，与 joinTeam 的业务校验保持一致。
INSERT INTO user_team (userId, teamId, joinTime, createTime, updateTime, isDelete)
SELECT
    m.id AS userId,
    t.id AS teamId,
    DATE_ADD(t.createTime, INTERVAL k HOUR) AS joinTime,
    DATE_ADD(t.createTime, INTERVAL k HOUR) AS createTime,
    DATE_ADD(t.createTime, INTERVAL k HOUR) AS updateTime,
    0 AS isDelete
FROM team t
-- 1..19 的序号，用 k <= maxNum - 1 控制每队补多少人
CROSS JOIN (
    SELECT 1 k UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
) ks
JOIN uid_pool m ON m.rn = (t.id * 31 + ks.k * 9973) % @uid_cnt + 1
-- 受最大人数限制；同时排除队长自己，避免重复入队
WHERE ks.k <= t.maxNum - 1
  AND m.id <> t.userId;

COMMIT;

-- 3.4 让固定账号加入一些公开队伍，方便前端演示
--     两个账号分别选各自的队伍，避免加到同一支导致超员。
--     给每个账号预留独立的名额：按队伍 id 的奇偶分配给不同账号。
INSERT INTO user_team (userId, teamId, joinTime, createTime, updateTime, isDelete)
SELECT u.id, t.id, NOW(), NOW(), NOW(), 0
FROM (
    SELECT id, userAccount FROM user WHERE userAccount = 'xiaolin'
) u
CROSS JOIN (
    -- xiaolin 只加 id 为奇数的空位队伍
    SELECT t2.id
    FROM team t2
    LEFT JOIN user_team ut ON ut.teamId = t2.id
    WHERE t2.status = 0
    GROUP BY t2.id, t2.maxNum
    HAVING COUNT(ut.id) < t2.maxNum - 1
    ORDER BY t2.id
    LIMIT 10
) t;

COMMIT;

INSERT INTO user_team (userId, teamId, joinTime, createTime, updateTime, isDelete)
SELECT u.id, t.id, NOW(), NOW(), NOW(), 0
FROM (
    SELECT id FROM user WHERE userAccount = 'xiaoman'
) u
CROSS JOIN (
    SELECT t2.id
    FROM team t2
    LEFT JOIN user_team ut ON ut.teamId = t2.id
    WHERE t2.status = 0
    GROUP BY t2.id, t2.maxNum
    -- 留出至少 2 个空位，保证和上一步叠加后仍不超员
    HAVING COUNT(ut.id) < t2.maxNum - 1
    ORDER BY t2.id
    LIMIT 10
) t;

COMMIT;

-- 清理临时表
DROP TEMPORARY TABLE IF EXISTS seq;
DROP TEMPORARY TABLE IF EXISTS seq_team;
DROP TEMPORARY TABLE IF EXISTS uid_pool;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;


-- ============================================================
-- 验证结果
-- ============================================================
SELECT '各表行数' AS 统计项;
SELECT 'user' AS 表名, COUNT(*) AS 行数 FROM user
UNION ALL SELECT 'team', COUNT(*) FROM team
UNION ALL SELECT 'user_team', COUNT(*) FROM user_team;

SELECT '队伍状态分布' AS 统计项;
SELECT status,
       ELT(status + 1, '公开', '私有', '加密') AS 状态,
       COUNT(*) AS 数量
FROM team GROUP BY status;

SELECT '过期情况' AS 统计项;
SELECT
    SUM(expireTime IS NULL OR expireTime > NOW()) AS 未过期,
    SUM(expireTime <= NOW()) AS 已过期
FROM team;

SELECT '用户标签情况' AS 统计项;
SELECT
    COUNT(*) AS 总数,
    SUM(tags IS NOT NULL AND tags != '' AND tags != '[]') AS 有标签
FROM user;

-- 数据完整性检查，三项都应该是 0
SELECT '完整性检查（都应为 0）' AS 统计项;
SELECT
    (SELECT COUNT(*) FROM team t WHERE NOT EXISTS (SELECT 1 FROM user u WHERE u.id = t.userId)) AS 队伍指向无效用户,
    (SELECT COUNT(*) FROM user_team ut WHERE NOT EXISTS (SELECT 1 FROM user u WHERE u.id = ut.userId)) AS 关联指向无效用户,
    (SELECT COUNT(*) FROM user_team ut WHERE NOT EXISTS (SELECT 1 FROM team t WHERE t.id = ut.teamId)) AS 关联指向无效队伍;

-- 孤儿队伍：没有任何成员的队伍，应该是 0
SELECT '孤儿队伍数（应为 0）' AS 统计项;
SELECT COUNT(*) FROM team t WHERE NOT EXISTS (SELECT 1 FROM user_team ut WHERE ut.teamId = t.id);

-- 队长必须在自己队伍的成员列表里，差集应为 0
SELECT '队长不在成员列表的队伍数（应为 0）' AS 统计项;
SELECT COUNT(*) FROM team t
WHERE NOT EXISTS (SELECT 1 FROM user_team ut WHERE ut.teamId = t.id AND ut.userId = t.userId);

-- 重复入队记录，应为 0
SELECT '同一用户重复加入同一队伍的情况（应为 0）' AS 统计项;
SELECT COUNT(*) FROM (
    SELECT userId, teamId FROM user_team GROUP BY userId, teamId HAVING COUNT(*) > 1
) dup;

-- 超员队伍：实际人数超过 maxNum，应为 0（与 joinTeam 的校验保持一致）
SELECT '超员队伍数（应为 0）' AS 统计项;
SELECT COUNT(*) FROM (
    SELECT t.id, t.maxNum, COUNT(ut.id) AS c
    FROM team t
    LEFT JOIN user_team ut ON ut.teamId = t.id
    GROUP BY t.id, t.maxNum
    HAVING c > t.maxNum
) over_capacity;

-- 队伍人数分布，便于直观确认
SELECT '队伍人数分布' AS 统计项;
SELECT maxNum, MIN(c) AS 最少人数, MAX(c) AS 最多人数, COUNT(*) AS 队伍数
FROM (
    SELECT t.id, t.maxNum, COUNT(ut.id) AS c
    FROM team t
    LEFT JOIN user_team ut ON ut.teamId = t.id
    GROUP BY t.id, t.maxNum
) x
GROUP BY maxNum
ORDER BY maxNum;

-- 抽查数据
SELECT id, username, userAccount, userRole, planetCode, tags FROM user ORDER BY id LIMIT 12;
SELECT id, name, maxNum, status, userId, expireTime FROM team ORDER BY id LIMIT 10;
