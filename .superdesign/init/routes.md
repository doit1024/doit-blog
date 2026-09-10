# Routes — doit's blog

Framework: Astro 5 file-based routing (`src/pages/`). Adapter: `@astrojs/cloudflare`. Site: `https://blog.doooit.me/`. Lang: `zh-CN`.

Shared shell on almost every page: `Layout.astro` (html/head) + `Header.astro` + `Footer.astro`.

| URL path | File | Layout | What it renders |
| --- | --- | --- | --- |
| `/` | `src/pages/index.astro` | Layout + Header + Footer (no Main) | Hero (name + italic quote + socials + cute bear image on sm+), featured posts, recent posts, "全部文章" link |
| `/posts` `/posts/[n]` | `src/pages/posts/[...page].astro` | Layout + Header + Main + Footer | Paginated post list (`Card`), page title "文章" |
| `/posts/[...slug]` | `src/pages/posts/[...slug]/index.astro` | PostDetails | Full article: BackButton, title, datetime, tags, prose, prev/next, comments, back-to-top |
| `/tags` | `src/pages/tags/index.astro` | Layout + Header + Main + Footer | Tag cloud (`Tag` size lg) |
| `/tags/[tag]/[...page]` | `src/pages/tags/[tag]/[...page].astro` | Layout + Header + Main + Footer | Posts filtered by tag |
| `/search` | `src/pages/search.astro` | Layout + Header + Main + Footer | Pagefind UI |
| `/archives` | `src/pages/archives/index.astro` | Layout + Header + Main + Footer | Posts grouped by year/month (gated by `SITE.showArchives`) |
| `/bb` | `src/pages/bb.astro` | Layout + Header + Main + Footer | Notion microblog cards (`MicroBlog`) |
| `/about` | `src/pages/about.md` + `AboutLayout.astro` | AboutLayout | Markdown bio + comments |
| `/changelog` | `src/pages/changelog.astro` | Layout + Header + Main + Footer | Parsed CHANGELOG.md + recent GitHub commits |
| `/404` | `src/pages/404.astro` | Layout + Header + Footer | Giant accent "404", shrug, link home |
| `/rss.xml` | `src/pages/rss.xml.ts` | — | RSS |
| `/robots.txt` | `src/pages/robots.txt.ts` | — | robots |

## New target (does not exist yet)

- **`/digital` (proposed)** — Everyday consumer-electronics showcase (手机 / 耳机 / 手表 / 笔记本 / 相机) with a 3D model viewer as the primary stage. Should reuse Header + Footer + blog tokens; Main's `max-w-3xl` reading column is too narrow for a product stage — the showcase content may go full-bleed inside the same header/footer shell.

No product, shop, or 3D routes exist today.

## Nav mapping (`Header.astro`)

- 文章 → `/posts`
- 标签 → `/tags`
- 哔哔 → `/bb`
- 关于 → `/about`
- 日志 → `/changelog`
- Archives icon → `/archives` (if `SITE.showArchives`)
- Search icon → `/search`
- Theme toggle (if `SITE.lightAndDarkMode`)
