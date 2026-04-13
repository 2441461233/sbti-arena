# SBTI Arena

一个基于 Next.js + MiniMax 大模型驱动的 **SBTI 人格竞技场**。选择你喜欢的人格，在不同的设定场景下与他们展开对话，并通过淘汰机制选出你的最终 Pick。

## 快速开始

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## 环境变量

在项目根目录创建 `.env.local`，至少配置以下变量：

```env
DATABASE_URL="postgresql://postgres:password@hostname:5432/zeabur"
MINIMAX_API_KEY="在这里填入你的 MiniMax API Key"
MINIMAX_MODEL="abab6.5s-chat"
```

说明：

- `DATABASE_URL` 现在使用 PostgreSQL，适合 Zeabur 数据库和其他线上环境。
- 首次连接新数据库时，执行 `npx prisma migrate deploy` 创建表结构。
- 本地开发如果没有自己的 Postgres，也可以暂时直接连 Zeabur 提供的开发库。

## 配置 MiniMax 大模型

本项目使用 MiniMax 的 `abab6.5s-chat` 模型来驱动各个人格的回复。为了让大模型正常工作，你需要配置 API Key。

### 1. 获取 API Key
1. 访问 [MiniMax 开放平台](https://platform.minimaxi.com/) 并注册登录。
2. 进入“账户管理” -> “API Keys”。
3. 点击“创建 API Key”，复制生成的 Key。

### 2. 启动项目

```bash
npm install
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

## Zeabur 部署

1. 在 Zeabur 新建一个 `Project`。
2. 添加一个 `PostgreSQL` 服务。
3. 从 GitHub 导入本仓库。
4. 在应用服务中配置环境变量：

```env
DATABASE_URL=你的 Zeabur PostgreSQL 连接串
MINIMAX_API_KEY=你的 MiniMax API Key
MINIMAX_MODEL=abab6.5s-chat
```

5. 构建命令填写：

```bash
npm install && npm run build
```

6. 启动命令填写：

```bash
npm run start
```

7. 首次部署完成后，在 Zeabur 控制台执行：

```bash
npm run db:migrate:deploy
```
