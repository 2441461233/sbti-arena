<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 项目概览

SBTI Arena — SBTI 人格竞技场排行榜应用。

- **框架**：Next.js App Router
- **数据库**：PostgreSQL + Prisma（当前部署：Vercel Postgres）
- **AI**：MiniMax REST API（`/api/chat` 路由直接调用，无 AI SDK）
- **部署**：Vercel

## 关键路径

- `src/lib/data.ts` — 25 种人格 + 4 个场景的静态数据（修改人格/场景在这里）
- `src/app/api/chat/route.ts` — AI 对话接口，组装 system prompt + 调用 MiniMax
- `src/app/api/leaderboard/route.ts` — 榜单 upsert（胜者 +1 分）
- `src/app/chat/ChatArena.tsx` — 核心对战页（多列并行对话 + 移动端标签切换）
- `prisma/schema.prisma` — 数据库模型（`Leaderboard` 表）

## 环境变量

```
DATABASE_URL       — PostgreSQL 连接串（Vercel Postgres 自动注入）
MINIMAX_API_KEY    — MiniMax API Key
MINIMAX_MODEL      — 默认 abab6.5s-chat
```

## 注意事项

- 移动端（< 768px）对话页使用标签切换单列布局；桌面端保持横向多列布局
- 首页使用 `force-dynamic` 保证每次访问获取最新榜单数据
- `prisma.ts` 在开发环境挂载到 `global` 防止热重载时多实例
