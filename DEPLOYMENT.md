# 前后端部署与运行指南（Day 19-20）

## 1. 本地开发运行

### 1.1 后端（server）
```bash
cd ai-haigui-game/server
# 首次
npm install
# 启动
node index.js
```

后端默认端口：`3000`。

> 启动前请先配置 `server/.env`（可由 `.env.example` 复制）：
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL`（可选）
- `DEEPSEEK_API_URL`（可选）
- `AI_REQUEST_TIMEOUT_MS`（可选）
- `PORT`（可选）

### 1.2 前端（web）
```bash
cd ai-haigui-game
npm install
npm run dev
```

前端开发端口默认由 Vite 分配（一般 5173），已配置 `/api` 代理到 `http://localhost:3000`。

### 1.3 一次性构建检查（部署前）
```bash
cd ai-haigui-game
npm run build
```

---

## 2. 线上部署建议

### 2.1 推荐架构
- 前端：Vercel（静态站点）
- 后端：Railway / Render / 任意 Node 托管平台

### 2.2 后端部署关键点
- 启动命令：`node index.js`
- 环境变量：
  - `DEEPSEEK_API_KEY`（可选：BYOK 前端直连 DeepSeek 时，后端仅用于提供 `GET /api/story-bottom/:storyId`）
  - `DEEPSEEK_MODEL`（可选）
  - `DEEPSEEK_API_URL`（可选）
  - `AI_REQUEST_TIMEOUT_MS`（可选）
  - `PORT`（通常平台自动注入）

### 2.3 前端部署关键点
- 若走前后端分离域名：
  - 生产环境需要把 `/api` 指向后端域名（建议通过反向代理或新增 `VITE_API_BASE_URL` 实现）
- 当前项目开发模式依赖 Vite 本地代理，生产环境不能直接使用 Vite 代理配置。

### 2.4 BYOK（用户自带 Key）模式说明
- 现在项目采用纯 BYOK：DeepSeek 的 API Key 由用户在页面输入（`Home` 页 “API Key 配置（BYOK）”）。
- Key 不会被上传到你的服务器；所有大模型请求直接由浏览器发起到用户的 DeepSeek 账号。
- 成本与配额：由用户自己的 DeepSeek 账号承担（你的平台不代付）。
- 安全与隐私：
  - 不要在公共设备或不受信任环境启用“保存到本地”。
  - 建议用户只使用会话级配置（不勾选本地保存）或自行承担本机存储风险。
- 仍需要保证浏览器能访问后端的 `/api/story-bottom/:storyId`（否则无法展示汤底并生成合规的 AI 判断）。

---

## 3. 常见问题排查

1. **`/api/story-bottom/:id` 返回 404/500**
   - 检查后端是否已部署并可通过浏览器访问
   - 检查 `storyId` 是否存在于后端数据中（`server/storiesFull.js`）

2. **前端请求超时**
   - 后端默认有超时控制（`AI_REQUEST_TIMEOUT_MS`）
   - 网络波动时可先提高超时并重试

3. **回答不是“是/否/无关”**
   - 前端会对模型输出做提取与二次重试
   - 仍异常时会提示用户换问法并兜底处理
   - 可继续迭代 system prompt 与输出提取逻辑
