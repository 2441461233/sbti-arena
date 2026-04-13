# SBTI Arena

一个基于 **Next.js + MiniMax 大模型**驱动的 **SBTI 人格竞技场**。从 25 种 SBTI 人格中挑选 2-3 位，在不同场景下展开 AI 对话对决，通过淘汰机制选出你的最终 Pick，并为其在全局排行榜加分。

## 技术栈

- **框架**：Next.js (App Router)
- **UI**：React + Tailwind CSS v4 + Framer Motion
- **数据库**：PostgreSQL + Prisma 5
- **AI**：MiniMax `abab6.5s-chat` 模型
- **部署**：Vercel + Vercel Postgres

## 快速开始（本地开发）

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## 环境变量

在项目根目录创建 `.env.local`，配置以下变量：

```env
DATABASE_URL="postgresql://postgres:password@hostname:5432/dbname"
MINIMAX_API_KEY="在这里填入你的 MiniMax API Key"
MINIMAX_MODEL="abab6.5s-chat"
```

## 配置 MiniMax 大模型

1. 访问 [MiniMax 开放平台](https://platform.minimaxi.com/) 注册登录
2. 进入「账户管理」→「API Keys」→「创建 API Key」
3. 将 Key 填入 `.env.local` 的 `MINIMAX_API_KEY`

## Vercel 部署

本项目当前部署在 Vercel，数据库使用 Vercel Postgres。

### 初次部署

1. 在 [Vercel 控制台](https://vercel.com/) 导入本仓库
2. 在项目的 **Storage** 选项卡创建一个 **Postgres** 数据库，Vercel 会自动注入 `DATABASE_URL` 环境变量
3. 在 **Settings → Environment Variables** 添加：
   ```
   MINIMAX_API_KEY=你的 MiniMax API Key
   MINIMAX_MODEL=abab6.5s-chat
   ```
4. 部署完成后，在 Vercel 控制台进入项目的 **Functions** 或本地运行：
   ```bash
   npx prisma migrate deploy
   ```
   以完成数据库表结构的创建

### 构建 & 启动命令

Vercel 自动检测 Next.js 项目，无需手动配置。如需自定义：

- **Build Command**：`npm run build`（已包含 `prisma generate`）
- **Start Command**：`npm run start`

## 大陆访问

`*.vercel.app` 域名在中国大陆无法访问。解决方案请参考 **[DEPLOYMENT_CHINA.md](./DEPLOYMENT_CHINA.md)**，使用自定义域名 + Cloudflare 代理即可，约 70 元/年，无需备案。

## 数据库命令

```bash
npm run db:generate      # 生成 Prisma Client
npm run db:migrate:deploy  # 部署迁移到生产数据库
```
