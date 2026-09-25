# 更新日志

记录本站（doit-blog）的产品改动。

## 最新（2026-09-25）

### 变更

- **站点**：ZHA-20: mobile header shows all nav items as 2-row chip grid（[#41](https://github.com/doit1024/doit-blog/pull/41)）
- **长文 Notion**：构建时用官方 API 拉 `Status=Published` 的页，转 Markdown 并入现有 `/posts`（标签 / 归档 / RSS / Pagefind / giscus）；图转存现有 R2 + WebP Cloud；Notion 失败或未配 token 则跳过该源，不挡整站；git MDX 长期保留（[#26](https://github.com/doit1024/doit-blog/pull/26)）
- **小声哔哔 `/bb`**：改为构建时静态生成（SSG）。`astro build` 用现有 `notion-client` 公开接口拉取 Notion 并烘焙 HTML，运行时不再请求 Notion、不再依赖 Worker SSR。Notion 更新后需触发 Cloudflare Workers Builds Deploy Hook 重建，见 [docs/bb-static-rebuild.md](docs/bb-static-rebuild.md)

### 优化

- **library**：封面按卡片和弹层尺寸走 WebP Cloud（[#38](https://github.com/doit1024/doit-blog/pull/38)）
- **读看听玩 `/library`**：首屏只渲染 30 条（默认不含「弃坑」），其余放进构建时 JSON，「加载更多」再追加；类型筛选覆盖尚未挂上的条目。标题和副标题改用与 `/bb` 相同的 `Main` 样式
- **页面切换**：去掉默认整页淡入淡出，导航悬停/点按时预取静态页，点击后立刻显示顶栏进度；文章页不再阻塞加载 jsDelivr 上的 lightGallery
- **小声哔哔 `/bb`**：静态化后导航链接与其它页一样进站预取
- **页头字体**：切换页面时保留 `@font-face`，避免粗体标题先闪成细字体再变回去

### 修复

- **长文**：treat Notion columns and dividers as first-class（[#43](https://github.com/doit1024/doit-blog/pull/43)）
- **images**：修复库页裂图和文章慢加载（[#39](https://github.com/doit1024/doit-blog/pull/39)）
- **library**：把类型「电视剧」改名为「剧集」（[#37](https://github.com/doit1024/doit-blog/pull/37)）
- **library**：把 /library 收回到和其他页面一样的内容宽度（[#33](https://github.com/doit1024/doit-blog/pull/33)）
- **站点**：文章详情页「返回」图标与文字用 `inline-flex` + `items-center` 垂直对齐（并略做光学对齐），不改版面（[#29](https://github.com/doit1024/doit-blog/pull/29)）
- **站点**：更新日志二级标题由「未发布」改为「最新（日期）」：本站改动多半在打 tag 前就已上线，「未发布」读起来别扭（[#29](https://github.com/doit1024/doit-blog/pull/29)）
- **站点**：自动 changelog 生成器同步改为写入「最新」，仍能识别旧的「未发布」/Unreleased，避免下次 Action 写回去（[#29](https://github.com/doit1024/doit-blog/pull/29)）
- **小声哔哔 `/bb`**：Notion `*.notion.site` 接口返回 403 时，自动切换到可用的 API 地址（[#14](https://github.com/doit1024/doit-blog/pull/14)）
- **小声哔哔 `/bb`**：没有内容时展示空状态提示（[#14](https://github.com/doit1024/doit-blog/pull/14)）
- **小声哔哔 `/bb`**：Notion 数据短缓存约 3 分钟（内存 + Cloudflare Cache），页面 HTML 边缘缓存 `s-maxage=180`（[#14](https://github.com/doit1024/doit-blog/pull/14)）
- **小声哔哔 `/bb`**：单条帖子拉取失败不再拖垮整页；缺少 page 块时更稳健（[#15](https://github.com/doit1024/doit-blog/pull/15)）
- **小声哔哔 `/bb`**：兼容 Notion 公共 API 双层 `value` 结构，恢复 `react-notion-x` 渲染（缓存 key：`microblog-v2`）
- **小声哔哔 `/bb`**：修复 Cloudflare 构建时 `astro check` 的 `tag` 隐式 any 报错

### 新增

- **长文 Notion**：非 `main` 构建（或 `NOTION_INCLUDE_PREVIEW=true`）收录 `Status=Preview`，预览站 `noindex` 且 `robots.txt` 禁止抓取；`main` 仍只发 `Published`（[#42](https://github.com/doit1024/doit-blog/pull/42)）
- **library**：默认看「书」，音乐方图并显示专辑艺人（[#40](https://github.com/doit1024/doit-blog/pull/40)）
- **library**：详情弹层，页面改称书影音游（[#36](https://github.com/doit1024/doit-blog/pull/36)）
- **页头**：把标签、日志、归档收进「更多」（[#35](https://github.com/doit1024/doit-blog/pull/35)）
- **读看听玩 `/library`**：构建时用官方 Notion API 拉取私有库「读看听玩」，浅色 2:3 海报墙，类型可在页内筛选。约定见 [docs/library.md](docs/library.md)
- **首页**：小熊开场轻转轻浮提示可拖，第一次拖过后停掉（[#30](https://github.com/doit1024/doit-blog/pull/30)）
- **更新日志**：打开 PR 时自动把主要改动写入 CHANGELOG 并提交回分支（[#28](https://github.com/doit1024/doit-blog/pull/28)）
- **长文 Notion**：Published 行进入现有 `/posts` 管道。约定见 [docs/notion-posts.md](docs/notion-posts.md)（[#26](https://github.com/doit1024/doit-blog/pull/26)）
- **小声哔哔 `/bb`**：在 Cloudflare Worker 上恢复全文 SSR 渲染 Notion 内容
- **站点**：新增 `/changelog` 更新日志页（近期提交 + 本文件），导航增加「日志」

### 说明

- 合入 PR 前由 GitHub Action 根据标题与说明自动写入本文件（`.github/workflows/changelog.yml`）。不需要记日志时给 PR 打 `skip-changelog`。
- 上游 AstroPaper 的完整历史仍在 git 中；本文件主要记录 doit-blog 自身改动。
- `/bb` 相关文件：`src/pages/bb.astro`、`src/utils/notion.js`、`src/components/MicroBlog.astro`、`docs/bb-static-rebuild.md`
- 长文 Notion 相关文件：`src/loaders/blog.ts`、`src/utils/notion-posts/`、`docs/notion-posts.md`
