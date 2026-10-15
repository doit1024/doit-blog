# 小声哔哔 `/bb` 轻反应

访客可以在每条 `.bb-note` 上点 **👏** 或 **💡**。计数只存在 Cloudflare KV 绑定 `BB_REACTIONS`，不写回 Notion，也**不会**因为一次点击去触发 Deploy Hook。`/bb` 仍然是 `prerender = true` 的静态页；数字在首屏之后由同源接口填上。

## 请求

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/api/bb/reactions?ids=id1,id2` | 批量读取。最多 50 个 id，缺 key 当 0。`Cache-Control: private, no-store` |
| `POST` | `/api/bb/reactions` | Body：`{"postId":"<notion-page-id>","emoji":"👏"}`。通过限流后该 emoji **+1** |

两条路由都是 `prerender = false`。其它方法返回 405。非法参数 400，限流 429，KV 不可用或读写失败 500。

帖子主键是 Notion page id，读写前去掉连字符并转成小写，和 `.bb-note` 的 `data-post-id` 相同。v1 **只增不减**，没有取消。

白名单只有 👏 和 💡。计数为 0 时按钮仍在，数字隐藏。

## KV

| Key | Value |
| --- | --- |
| `bb:rx:{postId}` | `{"👏":3,"💡":1}` |
| `bb:rl:{ipHash}:{postId}:{10s桶}` | `"1"`，TTL 60 秒（KV 不允许更短的 `expirationTtl`；10 秒窗口靠桶号，不靠 TTL） |
| `bb:rl:day:{ipHash}:{UTC日期}` | 当天已通过的 POST 次数，TTL 48 小时 |

`ipHash` 是 `SHA-256(CF-Connecting-IP + BB_RX_PEPPER)` 的前 16 位 hex。不保存原始 IP。读计数和限流标记时带 `cacheTtl: 60`（这份 Wrangler 拒绝更短的值；边缘上的下限后来降到了 30，60 两边都能用）。

限流：

- 同一 IP 哈希 + 同一帖：**10 秒内最多 1 次** POST（换 emoji 也算）
- 同一 IP 哈希：**每个 UTC 日最多 60 次** 通过的 POST
- KV 没有原子自增。个人站偶发并发丢一次计数可以接受

浏览器另外把 `bb:rx:voted:{postId}:{emoji}` 写进 `localStorage`。点过的按钮保持已选状态，不再发出 POST。清站点数据可以绕过；服务端限流仍然生效。

未设置 `BB_RX_PEPPER` 时，代码用仓库里的固定盐 `bb-rx-unset-pepper`，避免接口直接 500。这个盐是公开的，KV 如果泄漏，IPv4 可以被穷举。**上线前必须换成只有 Worker 知道的 secret。**

## Cloudflare 配置

命名空间已经建在当前连接的 Cloudflare 账号里，并写进 `wrangler.jsonc`：

| 用途 | Title | id |
| --- | --- | --- |
| 生产 `id` | `doit-blog-BB_REACTIONS` | `2878a796b33d4e8b8d1f6566439b8433` |
| 预览 `preview_id` | `doit-blog-BB_REACTIONS-preview` | `545a4d74c7b54be8adfa3ee40f2d7fd9` |

部署前在 Dashboard → **Workers & Pages** → **KV** 确认这两个 title 和 `doit-blog` Worker 在**同一个账号**。不在的话，不要沿用上面的 id，按下面的命令在正确账号里重建，再替换 `wrangler.jsonc`。

```bash
pnpm exec wrangler kv namespace create BB_REACTIONS
pnpm exec wrangler kv namespace create BB_REACTIONS_PREVIEW
```

把第一条命令打印的 id 填到 `kv_namespaces[].id`，第二条填到 `preview_id`。绑定名保持 `BB_REACTIONS`。

Dashboard 等价步骤：Workers & Pages → KV → Create → 名称用上表的 title → 复制 Namespace ID → Worker `doit-blog` → Settings → Bindings → KV namespace → Variable name `BB_REACTIONS`。

### Secret `BB_RX_PEPPER`

生产 Worker 上设置（会立刻发布一个新版本）：

```bash
pnpm exec wrangler secret put BB_RX_PEPPER
```

粘贴一长串随机字符串，不要提交到 git。Dashboard：Worker → Settings → Variables and Secrets → Add → Secret → Name 填 `BB_RX_PEPPER`。

本地 `astro dev` 读 `.dev.vars`（已 gitignore）：

```bash
echo 'BB_RX_PEPPER=local-dev-only' > .dev.vars
```

`wrangler.jsonc` 的 `assets` **不要** 设 `not_found_handling: "404-page"`。默认是静态文件优先，匹配不到的路径（包括 `/api/bb/reactions`）才进 Worker。`/bb` 仍然直接从 ASSETS 出去。

## 怎么验证

静态页：

```bash
pnpm exec astro check
node scripts/bb-reactions-check.mjs
```

浏览器（`pnpm dev` 或预览域名）：

1. 打开 `/bb`。每条有 id 的卡片底部有 👏 / 💡，数字先空着。首屏画完后脚本再请求 `GET /api/bb/reactions`。
2. 点 👏。数字变成 1，按钮进入已选（`aria-pressed="true"`）。刷新后数字还在，按钮仍是已选。
3. 再点同一个按钮：没有新的 POST（localStorage 软禁用）。
4. 清掉该站的 localStorage 后，10 秒内再点同一帖：界面回到原数字，并提示「请稍后再试」。直接打接口则第二条是 429：

```bash
curl -sS -D - -X POST 'https://blog.doooit.me/api/bb/reactions' \
  -H 'Content-Type: application/json' \
  -d '{"postId":"<32位page-id>","emoji":"👏"}'
```

Notion 里不需要新字段。改帖子正文仍走原来的 Deploy Hook；只改反应数不用重建。

## 这次不做

置顶、活动日历、帖间互链、评论、取消反应、D1、Durable Objects。
