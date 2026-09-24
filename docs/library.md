# 读看听玩 `/library`

`/library` 在 `astro build` 时用**官方 Notion API** 拉取私有数据库「读看听玩」，把海报墙烘焙进静态 HTML。线上访问不再请求 Notion。

这和长文同一条管线（`NOTION_TOKEN`、可选 R2、同一条 Deploy Hook），不是 `/bb` 的公开刮取。约定见 [docs/notion-posts.md](./notion-posts.md)。

页面背景固定为站点浅色 `#fffdfd`。类型筛选在浏览器里完成，不整页刷新。

首屏 HTML 只放当前排序下的 **30** 条（默认仍不含「弃坑」）。其余条目在构建时写进页面里的 JSON，「加载更多」再按 30 条挂进 DOM。切换类型或「弃坑」时，用这份 JSON 重新匹配，不依赖已经出现在页面上的卡片。

点击卡片打开浅色详情弹层（封面、标题、评分、短评、链接、创建时间），不离开本页。Esc、点遮罩、或「关闭」都会关掉，并把焦点还回那张卡片。没有评分、链接或创建时间时，对应一行不显示；没有短评时写一句「还没有短评。」评分画成 5 颗星，颜色用站点 `--accent`。

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
| 类型 | Select：书 / 电影 / 电视剧 / 综艺 / 音乐 / 游戏 | 筛选，以及 `类型 · 年份` |
| 日期 | Date | 有则取年份；条目按日期新到旧 |
| 状态 | Select：想看 / 进行中 / 已完成 / 弃坑 | 默认不显示「弃坑」，筛选项里可单独打开 |
| 创作者 | Text | 不进海报墙 |
| 标签 | Multi-select | 不进海报墙 |
| 短评 | Text | 弹层正文；空着则显示「还没有短评。」 |
| 评分 | Number | 弹层里的 5 颗星，空着则不显示。0–5 按原分；大于 5 且不超过 10 当成十分制除以 2；超过 10 先封顶到 10 再除以 2。归一化后正好落在半星（如 4.5，或十分制的 9）才画半颗，否则四舍五入到整颗星。读屏文案是「评分 4，满分 5」 |
| 链接 | URL | 弹层里的链接。域名是豆瓣时写作「在豆瓣查看」，否则「打开链接」 |
| （系统）创建时间 | `created_time` | 弹层里的「创建于」；没有则不显示 |

没有单独的「封面」属性。构建时用页面 **cover**；若没有，再用任意 files 属性里的第一张。都没有，或转存失败，则用同样 2:3 的文字卡片，网格不断。

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
