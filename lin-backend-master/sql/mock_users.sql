-- ============================================================
-- 测试数据脚本 · 用户表
--
-- 用途：
--   智能匹配 / 找伙伴 / 推荐用户 等功能需要多个带标签的用户才能看到效果，
--   单账号无法测试这些功能。
--
-- 使用方式：
--   1. 用 Navicat 打开 partner 库 → 新建查询 → 粘贴本文件 → 执行
--      或命令行：mysql -uroot -p123456 partner < sql/mock_users.sql
--   2. 脚本可重复执行，已存在的账号会自动跳过
--
-- 所有测试账号密码统一为：12345678
-- 密码存储方式是 MD5('xiaoling' + 密码)，与后端 UserServiceImpl 的 SALT 一致
-- ============================================================

USE partner;

-- ------------------------------------------------------------
-- 【可选】清空现有用户数据，从干净状态开始
-- 只想加数据、不想删原数据的，把下面两行注释掉
-- ------------------------------------------------------------
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE user;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. 管理员账号
-- ------------------------------------------------------------
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '管理员', 'admin', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '',
       '["Java","后端","管理"]', 0, 1, 'admin', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'admin');

-- ------------------------------------------------------------
-- 2. 主要测试账号（你自己用来登录的）
--    标签偏 Java 后端方向，方便和下面的用户算出匹配结果
-- ------------------------------------------------------------
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '小林', 'xiaolin', NULL, 1, '351bc26ff90b1689a649460562888a8a', '13800000001', 'xiaolin@test.com',
       '["Java","后端","Spring","MySQL","Redis","大厂"]', 0, 0, '10001', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'xiaolin');

-- ------------------------------------------------------------
-- 3. 普通测试用户 20 个
--    按技术方向分成 7 组，组内标签高度重合、组间有交叉，
--    这样智能匹配的结果才有区分度和说服力
-- ------------------------------------------------------------

-- 组 1：Java 后端（与 xiaolin 高度相似，匹配时应该排最前）
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '张伟', 'user01', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["Java","后端","Spring","MySQL","Redis","大厂"]', 0, 0, '10002', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user01');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '李静', 'user02', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', '["Java","后端","Spring","MyBatis","大厂","实习"]', 0, 0, '10003', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user02');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '王强', 'user03', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["Java","后端","MySQL","Redis","微服务","大厂"]', 0, 0, '10004', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user03');

-- 组 2：前端方向
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '刘洋', 'user04', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["前端","React","Vue","JavaScript","TypeScript"]', 0, 0, '10005', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user04');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '陈曦', 'user05', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', '["前端","React","Webpack","CSS","大厂"]', 0, 0, '10006', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user05');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '赵敏', 'user06', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', '["前端","Vue","小程序","JavaScript","实习"]', 0, 0, '10007', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user06');

-- 组 3：算法竞赛方向
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '孙浩', 'user07', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["算法","数据结构","C++","ACM","竞赛","保研"]', 0, 0, '10008', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user07');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '周雪', 'user08', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', '["算法","数据结构","LeetCode","Java","刷题"]', 0, 0, '10009', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user08');

-- 组 4：Python / AI 方向
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '吴磊', 'user09', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["Python","人工智能","机器学习","深度学习","读研"]', 0, 0, '10010', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user09');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '郑爽', 'user10', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', '["Python","数据分析","爬虫","Pandas","实习"]', 0, 0, '10011', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user10');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '冯涛', 'user11', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["Python","人工智能","NLP","大模型","算法"]', 0, 0, '10012', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user11');

-- 组 5：运维 / 云原生方向
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '褚风', 'user12', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["Linux","运维","Docker","Kubernetes","云计算"]', 0, 0, '10013', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user12');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '卫兰', 'user13', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', '["Linux","网络","Shell","运维","安全"]', 0, 0, '10014', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user13');

-- 组 6：移动端方向
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '蒋鹏', 'user14', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["Android","Kotlin","移动开发","Flutter"]', 0, 0, '10015', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user14');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '沈月', 'user15', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', '["iOS","Swift","移动开发","小程序"]', 0, 0, '10016', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user15');

-- 组 7：求职 / 考研方向
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '韩磊', 'user16', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["校招","实习","面经","秋招","Java"]', 0, 0, '10017', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user16');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '杨帆', 'user17', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', '["考研","保研","数学","408","复试"]', 0, 0, '10018', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user17');

-- 交叉用户：同时具备两个方向的标签，用来测试"部分匹配"的排序效果
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '朱峰', 'user18', NULL, 1, '351bc26ff90b1689a649460562888a8a', '', '', '["Java","后端","前端","React","全栈","大厂"]', 0, 0, '10019', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user18');

INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '秦淮', 'user19', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', '["Java","算法","MySQL","数据结构","刷题"]', 0, 0, '10020', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user19');

-- 无标签用户：用来验证 matchUsers 会正确跳过没有标签的人
INSERT INTO user (username, userAccount, avatarUrl, gender, userPassword, phone, email, tags, userStatus, userRole, planetCode, isDelete)
SELECT '新用户', 'user20', NULL, 0, '351bc26ff90b1689a649460562888a8a', '', '', NULL, 0, 0, '10021', 0
WHERE NOT EXISTS (SELECT 1 FROM user WHERE userAccount = 'user20');

-- ------------------------------------------------------------
-- 4. 验证结果
-- ------------------------------------------------------------
SELECT
    COUNT(*) AS 用户总数,
    SUM(CASE WHEN tags IS NOT NULL AND tags != '' AND tags != '[]' THEN 1 ELSE 0 END) AS 有标签用户数,
    SUM(CASE WHEN userRole = 1 THEN 1 ELSE 0 END) AS 管理员数
FROM user;

SELECT id, userAccount, username, gender, userRole, planetCode, tags
FROM user
ORDER BY id;

-- ------------------------------------------------------------
-- 5. 密码重置（如果登录失败，执行下面这句）
-- ------------------------------------------------------------
-- UPDATE user SET userPassword = MD5(CONCAT('xiaoling', '12345678'))
-- WHERE userAccount IN ('admin', 'xiaolin') OR userAccount LIKE 'user%';
