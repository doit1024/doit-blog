# 长文 Notion：约定、密钥与自动重建

新增长文在 Notion 数据库 **博客长文** 里写。`Status` 改为 **Published** 后，下一次 Cloudflare Workers Builds 会把它灌进现有 `/posts` 管道（和 git MDX 同一套 `PostDetails`、标签、归档、RSS、Pagefind、giscus）。

交互式 MDX 仍走 `src/data/blog`。已上线的两篇不迁。`/bb` 仍用公开刮取，本管线只用官方 Notion API。

## 数据库

| 项 | 值 |
| --- | --- |
| 名称 | 博客长文 |
| 可见性 | **私有**（不要公开整库） |
| Database ID | `142e38447a5e4791aa3a98cd7bc737cd` |
| 打开 | [app.notion.com 上的库](https://www.notion.so/142e38447a5e4791aa3a98cd7bc737cd) |

把 ID 配进 Cloudflare Builds 的 `NOTION_DATABASE_ID`。不要写进代码。

样例行 `notion-pipeline-sample` 是 **Draft**，不会进站。把 Status 改成 Published 才会出现在 `/posts/notion-pipeline-sample`。

### 属性

| 属性 | 类型 | 规则 |
| --- | --- | --- |
| Title | Title | 必填 |
| Status | Select：`Draft` / `Published` | 只有 Published 进站 |
| Slug | Rich text | 英文 kebab（`wakayama-travel`）。**发布后不要改**（giscus 按 pathname） |
| Description | Rich text | 必填（SEO / 列表摘要） |
| Tags | Multi-select | 可在 Notion 里加选项；空则回落 `others` |
| pubDatetime | Date | 空则用页面创建时间 |
| modDatetime | Date | 空则用上次编辑时间 |
| ogImage | Files | 构建时转存 R2；不要贴 notion.so 热链 |
| featured | Checkbox | 首页「推荐文章」 |

Slug 和 git 文章撞车时 **git 优先**，Notion 那篇会被跳过并打构建警告。

### V1 支持的块

段落、标题（H1–H3）、列表、引用、代码、图片、链接、简单表格。

其它块：构建警告，并降级或跳过 **该块**（callout → 引用，divider → `---`，多栏/同步块尽量摊平）。**不会**因此让整站 build 失败。

代码块的 Notion caption 会变成 Shiki 的 `file="..."` 文件名。正文开头会补 `## Table of contents`，和现有文章一样走 remark-toc。

## Cloudflare Builds 环境变量

全部配在 Worker 的 **Builds** 环境（构建时），**不要**进 git、**不要**进 Fork PR 的 GitHub Actions。

| 变量 | 密钥？ | 说明 |
| --- | --- | --- |
| `NOTION_TOKEN` | 是 | Internal Integration 的 secret。CI / fork PR 不设则跳过 Notion 源 |
| `NOTION_DATABASE_ID` | 否 | `142e38447a5e4791aa3a98cd7bc737cd` |
| `R2_ACCOUNT_ID` | 否 | Cloudflare 账户 ID |
| `R2_ACCESS_KEY_ID` | 是 | R2 API token |
| `R2_SECRET_ACCESS_KEY` | 是 | R2 API token secret |
| `R2_BUCKET_NAME` | 否 | 现有站点图床 bucket（`asset.doooit.me` 背后那个） |
| `R2_PUBLIC_BASE` | 否 | 可选，默认 `https://asset.doooit.me` |

图会上传到 `posts/<slug>/<blockId>.<ext>`，正文写成 WebP Cloud：`https://d28ebb3.webp.li/posts/<slug>/...`。禁止热链 `notion.so`。读看听玩封面走同一域名的 `library/<pageId>.<ext>`，存的 URL 不带尺寸；页面渲染时再加 `max_width` 和 `quality=60`，见 [docs/library.md](./library.md)。原点常量在 `src/utils/assets.ts`（`WEBP_CLOUD_ORIGIN`）。

没有 R2 时：文本仍发布，Notion 托管的图会被跳过（构建警告）。不要把过期的 Notion 文件 URL 写进 HTML。

### 失败策略

- 没有 token / database id：跳过 Notion 源，只发 git 文章。
- Notion API 失败（超时、401、5xx）：跳过 Notion 源，**整站照常部署**。
- 单篇缺 slug/标题/描述、或 slug 不合法：跳过该篇。
- 某张图转存失败：跳过该图，文章其余部分仍发。

`/bb` 的 fail-closed 行为不变。

## 展堂需要做的接线（代码已经就位，缺密钥则不会假装连上）

### 1. Notion Integration

1. 打开 [Notion integrations](https://www.notion.so/my-integrations) → **New integration**（Internal）。
2. 能力勾选 **Read content**（不必写）。
3. 复制 Internal Integration Secret → Cloudflare Builds `NOTION_TOKEN`。
4. 打开 [博客长文](https://www.notion.so/142e38447a5e4791aa3a98cd7bc737cd) → `•••` → **Connections** → 加上这个 integration。MCP 建库用的是个人账号，**构建 token 必须单独邀请**，否则 API 会 404。

### 2. R2

用现有 `asset.doooit.me` bucket。在 Cloudflare R2 管里创建一个 **Object Read & Write** 的 API token，填 `R2_*`。WebP Cloud 已指向该 bucket 的话，新 key `posts/...` 会自动出 WebP。

### 3. Deploy Hook（和 `/bb` 同一条）

确认 [docs/bb-static-rebuild.md](./bb-static-rebuild.md) 里的 Workers Builds Deploy Hook 已经建好。Hook URL 当密钥，不要进仓库。

只改 Notion、不推 git 时，要 POST 这条 Hook 才会重建。

### 4. 触发：官方 webhook 不够直，用 Make / n8n 打同一 Hook

Notion 官方 webhook 在订阅时会先 POST 一个 `verification_token`，必须回到 Integration 的 Webhooks 页 **粘贴校验**。Cloudflare Deploy Hook 只负责触发构建、不会把 token 显示给你，所以 **不要把官方 webhook 直接填成 Deploy Hook URL**。

推荐（少写代码）：

1. Make / Zapier / n8n：Notion「database item updated」（博客长文）。
2. 过滤 `Status = Published`（可选；不过滤也行，Draft 保存会多几次空构建，Cloudflare 会去重）。
3. HTTP POST 到 Deploy Hook（body 可空）。

若坚持官方 webhook：把 Notion webhook URL 填到 Make/n8n 的 HTTP 入口，从场景记录里复制 `verification_token` 完成 Notion 校验，再由场景 POST Deploy Hook。

推 `main` 本来就会构建；Hook 只覆盖「只改 Notion」的情况。

## 本地

```bash
# .env（gitignored）
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=142e38447a5e4791aa3a98cd7bc737cd
# 可选：R2_* 才能转存图片

pnpm install
pnpm run build
```

构建日志应有 `notion-posts: no NOTION_TOKEN... skip` 或 `notion-posts: N Published page(s)` / `loaded /posts/<slug>`。

GitHub Actions 的 `pnpm run build` **不要**注入 token，避免 fork PR 泄漏。无 token 时 Notion 源自动跳过，CI 只构建 git 文章 + `/bb` 公开 collection。`/library` 同样跳过，见 [docs/library.md](./library.md)。
