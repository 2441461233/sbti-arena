# SBTI Arena

一个基于 Next.js + MiniMax 大模型驱动的 **SBTI 人格竞技场**。选择你喜欢的人格，在不同的设定场景下与他们展开对话，并通过淘汰机制选出你的最终 Pick。

## 快速开始

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## 配置 MiniMax 大模型

本项目使用 MiniMax 的 `abab6.5s-chat` 模型来驱动各个人格的回复。为了让大模型正常工作，你需要配置 API Key。

### 1. 获取 API Key
1. 访问 [MiniMax 开放平台](https://platform.minimaxi.com/) 并注册登录。
2. 进入“账户管理” -> “API Keys”。
3. 点击“创建 API Key”，复制生成的 Key。

### 2. 配置环境变量
在项目的根目录下创建一个 `.env` 文件（如果还没有的话），并将你的 API Key 填入：

```env
DATABASE_URL="file:./dev.db"
MINIMAX_API_KEY="在这里填入你刚刚复制的_API_KEY"
```

保存后，重启开发服务器 (`npm run dev`)，大模型就可以正常输出回复了。
