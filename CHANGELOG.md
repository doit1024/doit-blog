# 更新日志

记录本站（doit-blog）的产品改动。

## 未发布（2026-09-09）

### 优化

- **页面切换**：去掉默认整页淡入淡出，导航悬停/点按时预取静态页，点击后立刻显示顶栏进度；文章页不再阻塞加载 jsDelivr 上的 lightGallery
- **页头字体**：切换页面时保留 `@font-face`，避免粗体标题先闪成细字体再变回去

### 修复

- **小声哔哔 `/bb`**：Notion `*.notion.site` 接口返回 403 时，自动切换到可用的 API 地址（[#14](https://github.com/doit1024/doit-blog/pull/14)）
- **小声哔哔 `/bb`**：没有内容时展示空状态提示（[#14](https://github.com/doit1024/doit-blog/pull/14)）
- **小声哔哔 `/bb`**：Notion 数据短缓存约 3 分钟（内存 + Cloudflare Cache），页面 HTML 边缘缓存 `s-maxage=180`（[#14](https://github.com/doit1024/doit-blog/pull/14)）
- **小声哔哔 `/bb`**：单条帖子拉取失败不再拖垮整页；缺少 page 块时更稳健（[#15](https://github.com/doit1024/doit-blog/pull/15)）
- **小声哔哔 `/bb`**：兼容 Notion 公共 API 双层 `value` 结构，恢复 `react-notion-x` 渲染（缓存 key：`microblog-v2`）
- **小声哔哔 `/bb`**：修复 Cloudflare 构建时 `astro check` 的 `tag` 隐式 any 报错

### 新增

- **小声哔哔 `/bb`**：在 Cloudflare Worker 上恢复全文 SSR 渲染 Notion 内容
- **站点**：新增 `/changelog` 更新日志页（近期提交 + 本文件），导航增加「日志」

### 说明

- 上游 AstroPaper 的完整历史仍在 git 中；本文件主要记录 doit-blog 自身改动。
- `/bb` 相关文件：`src/pages/bb.astro`、`src/utils/notion.js`、`src/components/MicroBlog.astro`
