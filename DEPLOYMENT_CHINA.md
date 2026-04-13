# 解决大陆访问问题：Vercel + 自定义域名 + Cloudflare

> **背景**：`*.vercel.app` 域名在中国大陆被屏蔽，但 Vercel 的底层服务器本身没有被封锁。只要通过自定义域名 + Cloudflare 代理，即可让大陆用户正常访问 Vercel 部署的应用。
>
> **无需备案**、无需迁移平台、无需修改任何代码。

---

## 总体流程

```
用户 (大陆) → Cloudflare CDN → Vercel 服务器
```

---

## 第一步：购买域名

推荐选项（按性价比排序）：

| 平台 | 网址 | 特点 |
|------|------|------|
| **Cloudflare Registrar** | https://www.cloudflare.com/products/registrar/ | 成本价，无溢价，约 $10/年，直接托管在 Cloudflare，省去迁移步骤 |
| Namecheap | https://www.namecheap.com/ | 老牌注册商，第一年常有优惠 |
| GoDaddy | https://www.godaddy.com/ | 知名度高，但续费较贵 |

**推荐购买 `.com` 域名**，例如 `sbti-arena.com`。  
**不要购买 `.cn`**（需要 ICP 备案）。

> 如果在 Cloudflare Registrar 购买，域名自动托管在 Cloudflare，可跳过第二步的 NS 迁移。

---

## 第二步：将域名 NS 托管到 Cloudflare

> 如已在 Cloudflare Registrar 购买，跳过本步骤。

1. 前往 [Cloudflare 官网](https://www.cloudflare.com/) 注册免费账号（**免费套餐即可**）
2. 点击「Add a Site」，输入你的域名
3. 选择 **Free** 套餐
4. Cloudflare 会给你两个 NS 记录，例如：
   ```
   ada.ns.cloudflare.com
   ben.ns.cloudflare.com
   ```
5. 登录你购买域名的注册商控制台，将 **Nameservers** 改为 Cloudflare 给出的两个 NS
6. 等待 NS 生效（通常 5 分钟到 1 小时）

---

## 第三步：在 Vercel 绑定自定义域名

1. 登录 [Vercel 控制台](https://vercel.com/)，进入你的 `sbti-arena` 项目
2. 点击 **Settings** → **Domains**
3. 点击 **Add**，输入你购买的域名，例如 `sbti-arena.com`
4. Vercel 会给出验证方式，通常是：
   - **CNAME 记录**：`www` → `cname.vercel-dns.com`
   - **A 记录**（根域名）：`@` → `76.76.21.21`

---

## 第四步：在 Cloudflare 添加 DNS 记录

进入 Cloudflare 控制台 → 你的域名 → **DNS** 页面，添加以下记录：

| 类型 | 名称 | 值 | 代理状态 |
|------|------|-----|----------|
| A | `@` | `76.76.21.21` | **橙云 ✓（已代理）** |
| CNAME | `www` | `cname.vercel-dns.com` | **橙云 ✓（已代理）** |

> ⚠️ **关键**：必须点亮橙色云朵图标（Proxied），这样流量才会经过 Cloudflare 的 CDN，大陆才能访问。  
> 如果是灰色云朵（DNS only），Cloudflare 只做 DNS 解析，大陆仍然无法访问。

---

## 第五步：回到 Vercel 完成域名验证

1. 在 Vercel 的 Domains 页面，刷新等待验证通过（绿色 ✓）
2. Vercel 会自动为自定义域名签发 SSL 证书（Let's Encrypt）

---

## 第六步：验证大陆可访问性

- 在手机上关闭 Wi-Fi，用 4G/5G 访问 `https://你的域名`
- 或使用 [站长工具 - 全国 Ping 检测](https://ping.chinaz.com/) 测试各地解析情况
- 或在 [网站测速工具](https://www.boce.com/) 测试国内各地访问速度

---

## 常见问题

**Q: Cloudflare 免费版够用吗？**  
A: 完全够用。免费版提供 CDN 加速、DDoS 防护、SSL 证书，对于此类小型应用没有流量限制。

**Q: 用了 Cloudflare 后访问会变慢吗？**  
A: 相比直接被墙访问不了，当然快。Cloudflare 在大陆有接入点（虽然走香港/新加坡节点），实际延迟 200ms 左右，对 Web 应用体验影响不大。

**Q: 需要在 Vercel 里做什么额外配置吗？**  
A: 不需要，代码零改动，只需要在 Vercel 里添加域名即可。

**Q: 自定义域名上的 HTTPS 是自动的吗？**  
A: 是的，Vercel 和 Cloudflare 都会自动管理 SSL 证书，全程 HTTPS。

**Q: 域名解析生效要多久？**  
A: NS 迁移最长 48 小时，但通常在 1 小时内完成。DNS 记录添加后通常 5 分钟内生效。

---

## 费用汇总

| 项目 | 费用 |
|------|------|
| 域名（.com，Cloudflare Registrar） | 约 $10/年（≈ 70 元/年） |
| Cloudflare CDN 代理 | **免费** |
| Vercel 绑定自定义域名 | **免费** |
| SSL 证书 | **免费** |

**总计：约 70 元/年即可解决大陆访问问题。**
