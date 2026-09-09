# Changelog

All notable changes to this project will be documented in this file.

## Unreleased (2026-09-09)

### Fix

- **microblog `/bb`**: fall back across Notion API bases when `*.notion.site` `queryCollection` returns 403 ([#14](https://github.com/doit1024/doit-blog/pull/14))
- **microblog `/bb`**: show an empty state when Notion returns no posts ([#14](https://github.com/doit1024/doit-blog/pull/14))
- **microblog `/bb`**: cache Notion payloads (~3 min in-memory + Cloudflare `caches.default`) and edge-cache `/bb` HTML (`s-maxage=180`, `stale-while-revalidate=600`) ([#14](https://github.com/doit1024/doit-blog/pull/14))
- **microblog `/bb`**: harden `MicroBlog` against missing page blocks; tolerate individual `getPage` failures ([#15](https://github.com/doit1024/doit-blog/pull/15))
- **microblog `/bb`**: normalize Notion nested `{ value: { value, role } }` recordMaps for `react-notion-x` (cache key `microblog-v2`)
- **microblog `/bb`**: fix Cloudflare `astro check` failure (`tag` implicit `any`)

### Feat

- **microblog `/bb`**: restore full SSR for `NotionRenderer` on Cloudflare Workers after recordMap normalization
- **site**: add `/changelog` page (recent commits + this file) and nav link 日志

### Notes

- Full upstream AstroPaper history remains in git; this file focuses on doit-blog product changes.
- Touched for `/bb`: `src/pages/bb.astro`, `src/utils/notion.js`, `src/components/MicroBlog.astro`
