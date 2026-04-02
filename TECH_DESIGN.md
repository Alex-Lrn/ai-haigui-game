# AI 海龟汤游戏 技术设计

## 1. 技术栈选择
- 前端：
  - React + TypeScript + Vite
  - Tailwind CSS（用于“游戏官网风格”统一：深蓝背景、青蓝霓虹、玻璃拟态）
  - 路由：React Router（后续实现 `Home / Game / Result`）
- 后端（建议必做，保护 API Key 并做输出兜底）：
  - Node.js + Express
  - 提供 `POST /api/chat`：封装大模型调用，并校验/兜底模型输出
- AI：
  - DeepSeek / 其它大模型 API（以支持 `是/否/无关` 强约束输出为准）

## 2. 项目结构（推荐落地目录）
> 当前你已经完成了 Tailwind 与欢迎页首屏。Day 5/6 的文档先把结构规划清楚，Day 7 起再按模块实现。

```
ai-haigui-game/
  src/
    components/
      GameCard.tsx         # 故事卡片（Home 列表）
      ChatBox.tsx          # 聊天输入 + 消息列表容器
      MessageBubble.tsx   # 单条消息气泡（区分 user/assistant）
      RuleCard.tsx        # 规则/提示卡片（可复用）
      ResultReveal.tsx    # 揭晓汤底的排版与动效容器
    pages/
      Home.tsx            # 游戏大厅（故事列表 + 入口）
      Game.tsx            # 游戏对话页（汤面 + 聊天）
      Result.tsx          # 揭晓页（展示汤底）
    data/
      stories.ts          # Story 数据（MVP：本地静态数组）
    lib/
      api.ts              # 网络请求封装（先前端直连/后端代理两种实现）
      aiPrompt.ts         # Prompt 生成与输出约束
      promptGuard.ts      # 轻量输出校验（后端为主，前端兜底可选）
    types/
      story.ts            # Story 类型
      message.ts          # Message 类型
      game.ts             # 游戏状态类型（GameStatus 等）
    styles/
      theme.css           #（可选）主题 token 与全局样式
    App.tsx               # 路由入口/页面容器
    main.tsx
```

## 3. 数据模型（保证前后端一致）
### 3.1 Story（海龟汤故事）
- `id: string`
- `title: string`
- `difficulty: 'easy' | 'medium' | 'hard'`
- `surface: string`  （汤面展示内容：前端可见）
- `bottom: string`   （汤底真相：后端/AI侧持有；仅在 Result 展示）

### 3.2 Message（对话消息）
- `id: string`
- `role: 'user' | 'assistant' | 'system'`
- `content: string`
- `timestamp: number`

### 3.3 GameState（游戏状态）
- `status: 'playing' | 'revealed' | 'ended'`
- `storyId: string`
- `messages: Message[]`
- `pending: boolean`（等待 AI 回复）

## 4. 核心流程（前后端如何协同）
1. `Home` 页面读取 `stories.ts`，展示故事卡片。
2. 点击故事进入 `Game`：
   - 展示 `surface`
   - 初始化 `messages`（可带一个 system 提示：只允许输出三选一）
3. 用户发送 `question`：
   - 前端立即追加 user 消息
   - 展示加载态消息（例如 content = “思考中…”或一个 loading flag）
   - 发请求到 AI：
     - MVP 阶段可先直接调用大模型（不推荐长期，Key 易暴露）
     - 正式架构使用后端：`POST /api/chat`
4. AI 返回 `answer`：
   - 后端先校验 answer 是否属于 `{是, 否, 无关}`
   - 校验失败走兜底：重试/降级为 `无关`（具体策略在后端实现）
   - 前端追加 assistant 消息并停止加载态
5. “查看汤底”进入 `Result`：
   - 展示 `story.title` 与 `story.bottom`（汤底揭晓）
   - 可选展示 `messages` 供复盘
6. “再来一局”返回 `Home`，清空状态并重新选择故事。

## 5. AI Prompt 设计（重点：强约束输出）
### 5.1 Prompt 目标
让模型只完成一个任务：**根据汤底判断玩家问题属于哪种关系**，并且只输出以下三种之一：
`是` / `否` / `无关`

### 5.2 Prompt 模板（概念级）
> 后端在构造请求时使用以下模板；其中 `{surface}` `{bottom}` `{question}` `{history}` 作为占位符替换。

**System（角色约束）**
- 你是海龟汤游戏主持人。
- 当前故事汤面与汤底：  
  - 汤面：{surface}  
  - 汤底：{bottom}
- 你将根据汤底判断玩家问题与真相的关系。
- 你只能回答以下三种之一：  
  1) `是`：与汤底一致  
  2) `否`：与汤底矛盾  
  3) `无关`：无法判断/与汤底无关  
- 你必须遵守：不解释、不补全、不透露汤底文本。

**User（对话输入）**
- 玩家问：{question}
{可选：历史摘要或最近几轮问题，避免上下文过长}

**Assistant（输出约束）**
- 只输出 `是` / `否` / `无关` 的单个词，不带标点、不带其它内容。

### 5.3 输出校验与兜底策略（前后端分工）
- 后端（主）：对模型返回的字符串做正则/枚举校验
  - 如果不属于三选一：
    - 进行一次“二次约束重试”（同一故事同一题）
    - 仍失败则降级输出：`无关`
- 前端（辅）：收到不合规输出时，用 system 消息提示用户换问法，并保持 UI 沉浸（可不做弹窗）

## 6. 接口与环境变量（概念级）
### 6.1 推荐后端接口
- `POST /api/chat`
  - body：
    - `storyId: string`
    - `question: string`
    - （可选）`history: Message[]` 或 `historySummary: string`
  - response：
    - `answer: '是' | '否' | '无关'`

### 6.2 环境变量（不要写死、不要提交）
- 前端（开发/构建）：
  - `VITE_AI_API_URL`：后端地址（如 `http://localhost:3000/api/chat`）
- 后端：
  - `DEEPSEEK_API_KEY`：AI Key
  - `DEEPSEEK_MODEL`：模型名

## 7. 验收清单（实现阶段用）
- `Home` 能看到故事卡片并进入 `Game`
- `Game` 显示汤面、能发送问题并收到 `是/否/无关`
- `Result` 能正确展示汤底
- UI 风格统一：深蓝背景 + 青蓝霓虹 + 玻璃拟态 + 动效克制
- 移动端可用：输入框与按钮不遮挡、聊天可滚动

