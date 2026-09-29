# 伙伴匹配系统 · 前端

基于 React 18 + Vite + Ant Design 5 的伙伴匹配系统前端，对接 `lin-backend-master` 后端。

## 快速开始

**启动前请确认后端已经在 `http://localhost:8080` 运行。**

```bash
# 1. 进入前端目录
cd lin-frontend

# 2. 安装依赖（首次运行需要，约 20 秒）
npm install

# 3. 启动开发服务器
npm run dev

# 4. 浏览器打开 http://localhost:3000
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器（端口 3000，改代码自动刷新） |
| `npm run build` | 打包生产版本到 `dist` 目录 |
| `npm run preview` | 本地预览打包后的产物 |

## 目录结构

```
lin-frontend/
├── index.html                # HTML 入口
├── vite.config.js            # 构建配置 + 后端代理配置
├── package.json              # 依赖清单
└── src/
    ├── main.jsx              # 程序入口，挂载 React
    ├── App.jsx               # 路由表 + 全局登录态
    ├── index.css             # 全局样式
    ├── api/                  # 接口层（所有后端请求都写在这里）
    │   ├── request.js        # axios 实例 + 统一错误处理
    │   ├── user.js           # 用户相关接口
    │   └── team.js           # 队伍相关接口
    ├── constants/index.js    # 枚举常量（队伍状态、性别、预设标签）
    ├── utils/format.js       # 日期格式化工具
    ├── layouts/
    │   └── BasicLayout.jsx   # 主布局（顶部导航栏）
    ├── components/
    │   ├── UserCard.jsx      # 用户卡片
    │   └── TeamCard.jsx      # 队伍卡片
    └── pages/
        ├── user/             # 用户相关页面
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── UserProfilePage.jsx
        │   ├── UserSearchPage.jsx
        │   ├── MatchPage.jsx
        │   └── RecommendPage.jsx
        └── team/             # 队伍相关页面
            ├── TeamListPage.jsx
            ├── TeamCreatePage.jsx
            ├── TeamDetailPage.jsx
            ├── TeamMyCreatePage.jsx
            └── TeamMyJoinPage.jsx
```

## 页面路由一览

| 路由 | 页面 | 是否需要登录 |
| --- | --- | --- |
| `/user/login` | 登录 | 否 |
| `/user/register` | 注册 | 否 |
| `/team/list` | 队伍广场（首页） | 否 |
| `/team/detail/:id` | 队伍详情 | 否 |
| `/team/create` | 创建队伍 | 是 |
| `/team/my/create` | 我创建的队伍 | 是 |
| `/team/my/join` | 我加入的队伍 | 是 |
| `/user/profile` | 个人资料 | 是 |
| `/user/search` | 找伙伴（按标签搜） | 是 |
| `/user/match` | 智能匹配 | 是 |
| `/user/recommend` | 推荐用户 | 是 |

## 关键设计说明

### 1. 为什么不用配 CORS？

`vite.config.js` 里配置了代理：

```js
proxy: {
  '/api': { target: 'http://localhost:8080', changeOrigin: true }
}
```

前端所有请求都发到 `/api/xxx`，由 Vite 开发服务器转发给后端 8080 端口。
对浏览器来说这是同源请求，因此不存在跨域问题。
后端 `application.yml` 里的 `context-path: /api` 正好与之匹配。

**部署到生产环境时**，代理不再生效，需要在 Nginx 里做同样的转发配置。

### 2. 登录态怎么保持？

后端用的是 session + cookie。`src/api/request.js` 里设置了：

```js
withCredentials: true
```

这一行是关键，没有它浏览器不会携带 cookie，登录状态就无法保持。

登录态存在后端 Redis 中（`store-type: redis`），有效期在 `application.yml` 的
`session.timeout: 86400` 配置（单位：分钟）。

### 3. 后端返回结构

所有接口都返回统一结构：

```json
{
  "code": 0,
  "data": { },
  "message": "ok",
  "description": ""
}
```

- `code === 0` 表示成功
- `code === 40100` 表示未登录，拦截器会自动跳转登录页
- 其他 code 表示业务异常

`request.js` 的响应拦截器已经统一处理：成功时直接返回 `res`，失败时弹
出错误提示并 reject。所以页面里写 `const res = await xxxApi(); res.data`
即可拿到真实数据。

### 4. 标签的处理

后端把 `tags` 存成 JSON 字符串（如 `"[\"Java\",\"前端\"]"`），
所以：

- **展示时**需要 `JSON.parse(user.tags)`
- **提交时**需要 `JSON.stringify(tagsArray)`

`UserCard.jsx` 和 `UserProfilePage.jsx` 里都做了这个转换。

### 5. 日期的处理

后端 `Date` 字段序列化后格式不固定，`src/utils/format.js` 提供了两个函数：

- `formatDateTime(value)`：展示用，转成 `YYYY-MM-DD HH:mm`
- `toBackendDateTime(date)`：提交用，转成 `YYYY-MM-DD HH:mm:ss`

Ant Design 的 DatePicker 返回的是 dayjs 对象，提交前要先 `.toDate()`。

## 已知限制

- **队伍成员列表**：后端未提供「按队伍 id 查询成员列表」的接口，因此队伍详情
  页只能展示队长信息，无法展示全部成员。如需此功能，需要后端新增接口。
- **管理后台**：后端有 `/user/search`（按昵称搜用户）和 `/user/delete`
  两个管理员接口，前端未提供入口。如需使用可以用 Postman 或
  Swagger 直接调用。
- **头像上传**：个人资料页的头像是填 URL，没有做文件上传。因为后端也没提供
  文件上传接口。

## 遇到问题？

请看项目根目录下的 `前端使用文档.md`，里面有更详细的图文操作步骤和
常见问题排查。
