# 小声哔哔 `/bb` 轻反应

访客在每条 `.bb-note` 上用一个低调的笑脸按钮打开反应面板，从固定的 7 个 emoji 里选一个。只有计数大于 0，或当前访客已经投过的 emoji，才会变成跟在笑脸后面的 chip。笑脸触发器始终排在最前。再点自己已点过的表情会撤销，计数减 1。计数和「已点」标记只存在 Cloudflare KV 绑定 `BB_REACTIONS`，不写回 Notion，也**不会**因为一次点击去触发 Deploy Hook。`/bb` 仍然是 `prerender = true` 的静态页；数字在首屏之后由同源接口填上。

## 请求

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/api/bb/reactions?ids=id1,id2` | 批量读取。最多 50 个 id，缺 key 当 0。同时返回当前访客已点的 emoji。`Cache-Control: private, no-store` |
| `POST` | `/api/bb/reactions` | Body：`{"postId":"<notion-page-id>","emoji":"👍","action":"add"}` 或 `"action":"remove"`。省略 `action` 时当作 `add` |

两条路由都是 `prerender = false`。其它方法返回 405。非法参数 400，重复新增或撤销一个不存在的投票返回 409，限流 429，KV 不可用或读写失败 500。

帖子主键是 Notion page id，读写前去掉连字符并转成小写，和 `.bb-note` 的 `data-post-id` 相同。

白名单是 👍 😄 🎉 😕 ❤️ 🚀 👀。👎 已从白名单和选择器里拿掉：旧 KV 里的 👎 计数不再读出、不再接受写入，也不做迁移；下次改写这条帖子的计数时，这个键会原样留在 JSON 里。没有任何反应时，静态 HTML 里只有笑脸触发器。点开后是这一排 emoji；点中即关闭面板。未点过则乐观 +1，已点过则乐观 −1（不低于 0），再按服务端计数校准。已点的 chip 带 `aria-pressed="true"`（描边用强调色），再点就是撤销。

服务端按 `ipHash + postId + emoji` 记一个「已点」标记。已点才能撤销，未点才能新增，所以同一次投票不会被重复加减。GET 的 `mine[postId]` 是这个访客已点的 emoji 列表，UI 用它高亮。浏览器里的 `localStorage` 键 `bb:rx:voted:{postId}:{emoji}` 只做首屏缓存，下次 GET 以服务端为准。

## KV

| Key | Value |
| --- | --- |
| `bb:rx:{postId}` | `{"👍":3,"❤️":1}`，缺的白名单 emoji 当 0。白名单以外的键（例如旧的 👎）保留但不返回 |
| `bb:mine:{ipHash}:{postId}:{emoji}` | `"1"` 表示这个访客已经点过。撤销时删除。不过期 |
| `bb:rl:{ipHash}:{postId}:{emoji}:{10s桶}` | `"1"`，只在**新增**通过后写入，TTL 60 秒（KV 不允许更短的 `expirationTtl`；10 秒窗口靠桶号，不靠 TTL）。撤销时删除当前桶，避免马上再点被 429 |
| `bb:rl:day:{ipHash}:{UTC日期}` | 当天已通过的新增和撤销次数，TTL 48 小时 |

`ipHash` 是 `SHA-256(CF-Connecting-IP + BB_RX_PEPPER)` 的前 16 位 hex。不保存原始 IP。读计数和限流标记时带 `cacheTtl: 60`（这份 Wrangler 拒绝更短的值；边缘上的下限后来降到了 30，60 两边都能用）。

限流：

- 同一 IP 哈希 + 同一帖 + 同一个 emoji：短窗口**只限制新增**。10 秒内的第二次新增返回 429。撤销不看这个窗口，并且会清掉当前桶的 key，所以点了马上取消、再马上点回去不会被误伤
- 同一 IP 哈希：**每个 UTC 日最多 60 次** 通过的新增或撤销（全站合计，不按 emoji 拆）。被 409 拒绝的请求不计入
- 先写「已点」标记，再改计数。KV 没有事务；请求中途失败最多丢掉一次加减，重试不会把同一次投票再加减一遍
- KV 没有原子自增。个人站偶发并发丢一次计数可以接受

旧的 👏 / 💡 / 👎 不在白名单里，接口会当成未知 emoji 拒绝，也不会再显示。

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

1. 打开 `/bb`。没有反应的卡片底部只有一个圆形笑脸，不铺空按钮。首屏画完后脚本请求 `GET /api/bb/reactions`。
2. 点笑脸。面板展开（触发器 `aria-expanded="true"`），里面是 👍 😄 🎉 😕 ❤️ 🚀 👀，没有 👎。点 👍 后面板关闭，笑脸右边出现 `👍 1` chip，且 `aria-pressed="true"`（强调色描边）。刷新后 chip 还在，GET 的 `mine` 里有 👍。
3. 再点这个 chip：POST `action: "remove"`，计数减 1。减到 0 且没有别人的计数时 chip 消失。马上再点一次 👍：应成功加回，而不是 429。
4. 清掉该站的 localStorage 后刷新：已点状态跟 GET 的 `mine` 走，不跟本地缓存走。10 秒内对同一帖先点 👍 再点 😄：两个都应成功。已经点过的 👍 再点是撤销，不是第二条新增。直接打接口时，重复 `add` 是 409，没有「已点」标记时的 `remove` 也是 409：

```bash
curl -sS -D - -X POST 'https://blog.doooit.me/api/bb/reactions' \
  -H 'Content-Type: application/json' \
  -d '{"postId":"<32位page-id>","emoji":"👍","action":"add"}'
```

Notion 里不需要新字段。改帖子正文仍走原来的 Deploy Hook；只改反应数不用重建。

## 这次不做

置顶、活动日历、帖间互链、评论、D1、Durable Objects。
