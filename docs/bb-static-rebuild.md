# 小声哔哔 `/bb`：静态构建与自动重建

`/bb` 在 `astro build` 时拉取公开 Notion collection，把帖子 HTML 烘焙进部署产物。线上访问不再请求 Notion，也不再走 Cloudflare Worker SSR。

## 构建时发生了什么

1. `src/pages/bb.astro` 设置 `export const prerender = true`。
2. 构建期调用 `getMicroBlogData()`（`src/utils/notion.js`）。
3. 仍走现有的非官方公开接口：`notion-client` + 多 API base 回退 + `recordMap` 归一化，再交给 `react-notion-x` 的 `NotionRenderer` 输出 HTML。
4. 产物里应有静态文件（例如 `dist/bb/index.html`），里面已经包含帖子正文。

运行时不再使用 Cloudflare `caches.default` 或请求级内存缓存。`astro dev` 里仍有约 3 分钟的进程内缓存，避免本地刷新反复打 Notion。

## Cloudflare 构建需要的环境变量

**默认不需要 Notion token。** 公开 collection 用 `notion-client` 即可。

Cloudflare Workers Builds 需要：

- Node 构建环境（现有 `pnpm run build`）
- 出网访问 `www.notion.so`（以及回退用的 `*.notion.site`）
- **不必** 在 Worker 绑定里加 Notion secret
- **不必** 为 `/bb` 配置任何 Astro/Cloudflare secret。请求会带浏览器 User-Agent，避免 Node 构建对 `www.notion.so` 被 403

`@astrojs/cloudflare` 适配器仍然保留：当前 `wrangler.jsonc` 按 Worker + assets 部署。全部页面静态化后 Astro 会提示 adapter「不必要」，先不要删，否则 `_worker.js` 产物路径会对不上。

可选：

| 变量 | 作用 |
| --- | --- |
| `BB_ALLOW_EMPTY=1` | Notion 全部拉失败时仍允许构建，并烘焙空的 `/bb`（紧急发布站点其它页面时用）。默认未设置时，拉不到帖子会让 **整个 `astro build` 失败**，避免把空白页部署上去。 |

不要把 Deploy Hook URL 写进仓库。

## Notion 更新后如何自动重建

静态页不会在访客请求时刷新。数据库有新内容后，需要再跑一次构建。

### 1. 创建 Cloudflare Workers Builds Deploy Hook

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → 本站 Worker（`doit-blog`）。
2. **Settings** → **Builds** → **Deploy Hooks**。
3. 新建 Hook，绑定生产分支（一般是 `main`）。
4. 复制生成的 POST URL（视为密钥）。

触发方式：对 Hook URL 发 **POST**（body 可空）：

```bash
curl -X POST "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<DEPLOY_HOOK_ID>"
```

文档：[Workers Builds Deploy Hooks](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/)。

同一 Hook 在短时间内多次触发时，Cloudflare 会去重，避免连续 webhook 把队列打满。

### 2. 建议的触发源

任选其一即可：

- **Make / Zapier / n8n**：Notion「database updated / item added」→ HTTP POST 到 Deploy Hook。
- **定时**：每小时/每天 POST 一次；或用带 [Cron Trigger](https://developers.cloudflare.com/workers/configuration/cron-triggers/) 的 Worker 去 POST。
- **手动**：Dashboard 里重试/触发构建，或本地执行上面的 `curl`。
- **推代码**：推到 `main` 本来就会走 Workers Builds；只改 Notion、不改代码时才需要 Hook。

### 3. 验证重建是否生效

1. 在 Notion 里新增或改一条微博。
2. 触发 Deploy Hook，等 Builds 成功。
3. 打开 https://blog.doooit.me/bb ，查看源码：帖子正文应在 HTML 里（不依赖客户端再去拉 Notion）。
4. 可选：`curl -sI https://blog.doooit.me/bb` 确认是静态资源/边缘缓存，而不是每次都跑 Worker 去请求 Notion。

## 本地验证

```bash
pnpm install
pnpm run build
# 静态 HTML 里应有 Notion 渲染后的内容
grep -l "notion-page" dist/bb/index.html

# @astrojs/cloudflare 不支持 `astro preview`，直接起静态服务看产物即可：
python3 -m http.server --directory dist 4321
# 打开 http://localhost:4321/bb/
```

构建日志里应看到类似：`getMicroBlogData: fetched N pages via …`。本地构建确认 `dist/bb/index.html` 含 10 条 `notion-page` 正文。
