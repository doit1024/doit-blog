# 读看听玩 `/library`

`/library` 在 `astro build` 时用**官方 Notion API** 拉取私有数据库「读看听玩」，把海报墙烘焙进静态 HTML。线上访问不再请求 Notion。

这和长文同一条管线（`NOTION_TOKEN`、可选 R2、同一条 Deploy Hook），不是 `/bb` 的公开刮取。约定见 [docs/notion-posts.md](./notion-posts.md)。

页面背景固定为站点浅色 `#fffdfd`。类型筛选在浏览器里完成，不整页刷新。

工具栏只有「书 / 电影 / 剧集 / 音乐 / 游戏」。没有「全部」，也没有「综艺」。打开页面时选中「书」。综艺仍会从 Notion 读进来、写进页面 JSON，但没有标签可选，所以这些卡片在页面上到不了。

首屏 HTML 只放默认筛选「书」里、按日期新到旧的前 **30** 条。其余条目（含其它类型和综艺）在构建时写进页面里的 JSON，「加载更多」再按 30 条挂进 DOM。切换类型时，用这份 JSON 重新匹配，不依赖已经出现在页面上的卡片。

点击卡片打开浅色详情弹层（封面、标题、评分、短评、链接、创建时间），不离开本页。类型是「游戏」且填了「游戏时长（小时）」时，弹层多一行「游戏时长」，例如「12 小时」或「1.5 小时」。类型是「音乐」且填了「专辑艺人」时，弹层多一行「专辑艺人」。Esc、点遮罩、或「关闭」都会关掉，并把焦点还回那张卡片。没有评分、链接、创建时间，游戏没有时长，或音乐没有专辑艺人时，对应一行不显示；非游戏即使填了时长也不显示，非音乐即使填了专辑艺人也不显示。没有短评时写一句「还没有短评。」评分画成 5 颗星，颜色用站点 `--accent`。

## 数据库

| 项 | 值 |
| --- | --- |
| 名称 | 读看听玩 |
| 可见性 | **私有** |
| 数据库页 | [打开](https://www.notion.so/5e604a29d16147799b21e0dc6a068b66) |
| Data source ID | `4ea5ec35-f007-4ee0-b426-2b95798680a9` |

把 data source ID 配进 Cloudflare Builds 的 `NOTION_MEDIA_DATABASE_ID`。不要写进代码。

### 属性

| 属性 | 类型 | 页面上怎么用 |
| --- | --- | --- |
| 标题 | Title | 海报下方标题 |
| 类型 | Select：书 / 电影 / 剧集 / 综艺 / 音乐 / 游戏 | `类型 · 年份`，以及工具栏。工具栏不含「全部」和「综艺」，默认「书」。旧选项名「电视剧」在构建时归一成「剧集」，筛选「剧集」也会命中旧值。类型「音乐」的行会进「音乐」 |
| 日期 | Date | 有则取年份；条目按日期新到旧 |
| 状态 | Select：想看 / 进行中 / 已完成 / 弃坑 | 不进海报墙，页面上也不再单独筛选 |
| 创作者 | Text | 不进海报墙 |
| 标签 | Multi-select | 不进海报墙 |
| 短评 | Text | 弹层正文；空着则显示「还没有短评。」 |
| 评分 | Number | 弹层里的 5 颗星，空着则不显示。0–5 按原分；大于 5 且不超过 10 当成十分制除以 2；超过 10 先封顶到 10 再除以 2。归一化后正好落在半星（如 4.5，或十分制的 9）才画半颗，否则四舍五入到整颗星。读屏文案是「评分 4，满分 5」 |
| 游戏时长（小时） | Number | 仅类型为「游戏」且有数值时，弹层显示「游戏时长」和小时数（整数不带小数，最多两位小数）。空着、负数，或不是游戏，都不显示 |
| 专辑艺人 | Text | 仅类型为「音乐」且有文字时，弹层显示「专辑艺人」。空着或不是音乐，都不显示 |
| 专辑标识 | Text | 不进页面 |
| 已记录播放次数 | Number | 不进页面 |
| 链接 | URL | 弹层里的链接。域名是豆瓣时写作「在豆瓣查看」，否则「打开链接」 |
| （系统）创建时间 | `created_time` | 弹层里的「创建于」；没有则不显示 |

没有单独的「封面」属性。构建时用页面 **cover**；若没有，再用任意 files 属性里的第一张。都没有，或转存失败，则用文字卡片，网格不断。音乐是 1:1，其余类型是 2:3。

## Cloudflare Builds 环境变量

和长文共用 `NOTION_TOKEN` 与 `R2_*`。多一个库 ID。

| 变量 | 密钥？ | 说明 |
| --- | --- | --- |
| `NOTION_TOKEN` | 是 | 已有的 Internal Integration secret。CI / fork PR 不设 |
| `NOTION_MEDIA_DATABASE_ID` | 否 | `4ea5ec35-f007-4ee0-b426-2b95798680a9` |
| `R2_*` | 同长文 | 可选。配齐后封面上传到 `library/<pageId>.<ext>`，页面写 WebP Cloud 地址 |

### 封面

- 有 R2：Notion 文件和外部封面都转存，HTML 里是稳定地址。
- 没有 R2：Notion 托管的封面**不写进 HTML**（签名 URL 会过期），该条变成文字卡。外部封面 URL（例如 Wikimedia）会原样保留，宿主若禁热链，浏览器会回落成文字卡。

存进内容和 `data-cover` 的是**不带 query** 的地址（WebP Cloud 或外链）。网格和弹层在渲染时再派生尺寸，见下一节。加载更多和筛选用的 JSON 同样只存原地址。

### 封面尺寸（WebP Cloud）

网格一次要拉很多张 2:3 海报。原图常常是一千多像素宽，直接用存储地址会下完整张优化图。渲染时只给 `https://d28ebb3.webp.li/...` 加上 [`max_width`](https://docs.webp.se/webp-cloud/feature/) 和 `quality=60`（`src/utils/assets.ts` 的 `withWebpCloudMaxWidth`）。外链不加参数。

| 用途 | 参数 | 常量 |
| --- | --- | --- |
| 网格缩略图 | `?max_width=360&quality=60` | `LIBRARY_COVER_THUMB_MAX_WIDTH`，`LIBRARY_COVER_QUALITY` |
| 详情弹层 | 同一 URL（`max_width=360`） | `LIBRARY_COVER_MODAL_MAX_WIDTH`，同一档 quality |

常量在 `src/components/library/covers.ts`。改 `.library-grid` / `.library-dialog-poster` 的 CSS 宽度时一起改。

怎么定的：

- 内容栏是 `max-w-3xl`（含 `px-4` 后内宽约 736px）。宽屏大约 4 列，单卡大约 **176px**。360 大约是 2 倍，够视网膜；手机上卡片更窄（大约 115px），360 也盖得住 3 倍屏。
- 弹层海报 CSS 最大是 `11.25rem`（180px）。网格和弹层都请求 `max_width=360`，这样点开卡片会命中已经拉过的那条缓存。`540` 以上是另一条缓存键，冷 Miss 时大海报会 504。
- 只用 `max_width`。同时传 `width` 和 `height` 会做 attention crop。版式用 CSS `object-fit: cover` 裁切：音乐是 1:1（`.poster.is-square`），其余类型是 2:3。原图比例留着。
- `max_width` 不会放大小图：本来就窄于上限的封面字节数不变。
- 网格和弹层都带 `quality=60`（覆盖 Dashboard，范围 10–100）。只作用在封面 URL 上，长文图仍走 Dashboard。`quality` 和 `max_width` 一起组成缓存键。
- `<img>` 的 `width` / `height` 跟版式走：其余类型 2:3（360×540），音乐 1:1（360×360）。`alt` 留空（标题在卡片文字里）。网格默认 `loading="lazy"`；首屏前 4 张 `eager`，第一张 `fetchpriority="high"`。弹层不懒加载，音乐弹层封面同样是 1:1。封面加载失败落到文字卡。
- 构建转存 R2 时会把过宽的封面压到最长边 1600。WebP Cloud 冷 Miss 仍会去拉整份 origin；origin 太大时请求会挂死。

### Dashboard（代码改不到）

在 WebP Cloud 的 Proxy 编辑页，不在这个仓库里：

- **Quality**（10–100，100 是无损）：库封面在 URL 里写 `quality=60`，不跟这里走。改这一档会清掉整个 Proxy 的缓存，并改变长文图；`/library` 封面不受影响。
- **Adaptive Resize**（按 User-Agent 把过宽的图缩到桌面/手机上限，默认桌面 1600、手机 800）：库的 `max_width` 已经更小，不依赖这项。打开之后，这个 Proxy 上**所有**图都会被封顶，包括长文。桌面宽度请保持至少 1600（正文栏大约 736px，2 倍屏需要这么宽）。不要把手机宽度收成卡片那么窄。
- **Consistency Mode**：冷 Miss 时先回 origin 再后台优化。现有 `gallery/DSC_*.jpg` 仍是千万像素相机原图（十几 MB），打开这项会让第一次请求直接下原图，更慢。长文 HTML 已带 `?width=640/960/1280`，请保持 Rapid，并在下面预热这些宽度。
- **`asset.doooit.me` 源站**：浏览器不要直连。lightGallery 和 `<img>` 都走 `d28ebb3.webp.li`。若自定义域传体很慢，WebP Cloud 冷 Miss 也会挂；可在 R2 自定义域上看一下缓存/回源。

### 缓存

见 [Cache](https://docs.webp.se/webp-cloud/cache/)。每个完整 URL（含 query）单独缓存。第一次是 Miss；Consistency 模式下冷请求可能先是 Filling，响应头 `x-webpcloud-cache`。之后同一 URL 是 Hit。网格和弹层共用 `max_width=360`。免费额度 200MiB，满了按 LRU 淘汰。不要缓存未加 `width` / `max_width` 的相机原图，那会把额度打满、之后每张都 Miss。

构建**不会**去预热。库里有六百多张封面。冷的 `max_width` 第一次是 Miss（大图可能先 Filling，要几秒），放进 `astro build` 会把构建拖慢；更大的宽度还会 504。部署后如果希望首访就是 Hit，可以在构建之外慢慢打一遍（失败忽略，可重试）：

```bash
curl -fsSL -A Mozilla https://doooit.me/library \
  | grep -oE 'https://d28ebb3\.webp\.li/library/[^"[:space:]]+' \
  | sed 's/?.*//' \
  | sort -u \
  | xargs -n 1 -P 2 -I{} sh -c '
      curl -fsSL -o /dev/null --retry 2 --retry-delay 2 -A library-preheat "$1?max_width=360&quality=60" || true
    ' _ {}
```

只关心首屏时，把 `max_width=360&quality=60` 打在 HTML 里前 30 张 `<img>` 上即可。

### 失败策略

- 没有 token 或 `NOTION_MEDIA_DATABASE_ID`：跳过，`/library` 是空状态，**整站照常部署**。
- Notion API 失败：同样跳过，不挡其它页面。
- 单张封面转存失败：该条用文字卡。

## 接线

长文如果已经有 integration，**同一个**就可以，但必须再邀请到这个库。只连了「博客长文」时，读这个库会 404。

1. 打开 [读看听玩](https://www.notion.so/5e604a29d16147799b21e0dc6a068b66) → `•••` → **Connections** → 加上持有 `NOTION_TOKEN` 的 integration（Read content）。
2. Cloudflare Builds 设置 `NOTION_MEDIA_DATABASE_ID=4ea5ec35-f007-4ee0-b426-2b95798680a9`。`NOTION_TOKEN` 与长文相同即可。
3. 需要封面进 R2 时，沿用 [docs/notion-posts.md](./notion-posts.md) 里的 `R2_*`。
4. Deploy Hook 与 `/bb`、长文是**同一条**。只改 Notion、不推 git 时，POST 这条 Hook 才会重建。见 [docs/bb-static-rebuild.md](./bb-static-rebuild.md)。

## 本地

```bash
# .env（gitignored）
NOTION_TOKEN=secret_...
NOTION_MEDIA_DATABASE_ID=4ea5ec35-f007-4ee0-b426-2b95798680a9
# 可选：R2_* 才能转存封面

pnpm run build
```

构建日志应有 `library: no NOTION_TOKEN... skip`，或 `library: N item(s), covers ...`。

没有 token 时，可设 `LIBRARY_PREVIEW_JSON` 指向一份本地 JSON 数组（字段与页面卡片相同）只看版式。不要把这份文件或密钥提交进 git。
