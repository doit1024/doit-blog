# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## Unreleased (2026-09-09)

### Fix

- **microblog `/bb`**: fall back across Notion API bases when `*.notion.site` `queryCollection` returns 403 ([#14](https://github.com/doit1024/doit-blog/pull/14))
- **microblog `/bb`**: show an empty state when Notion returns no posts ([#14](https://github.com/doit1024/doit-blog/pull/14))
- **microblog `/bb`**: cache Notion payloads (~3 min in-memory + Cloudflare `caches.default`) and edge-cache `/bb` HTML (`s-maxage=180`, `stale-while-revalidate=600`) to limit Notion API traffic ([#14](https://github.com/doit1024/doit-blog/pull/14))
- **microblog `/bb`**: harden `MicroBlog` against missing page blocks; tolerate individual `getPage` failures with `Promise.allSettled` ([#15](https://github.com/doit1024/doit-blog/pull/15))
- **microblog `/bb`**: normalize Notion public API nested `{ value: { value, role } }` recordMaps so `react-notion-x` and page-block detection work again (cache key bumped to `microblog-v2`)
- **microblog `/bb`**: fix Cloudflare `astro check` failure (`tag` implicit `any` in `MicroBlog.astro`)

### Feat

- **microblog `/bb`**: restore full SSR for `NotionRenderer` on Cloudflare Workers (post bodies in the initial HTML; no `client:only`) after recordMap normalization

### Notes

- Intermediate mitigation used `client:only` when Worker SSR truncated HTML mid-page; root cause was primarily the nested recordMap shape, after which SSR was restored.
- Touched files: `src/pages/bb.astro`, `src/utils/notion.js`, `src/components/MicroBlog.astro`

## v5.5.0 (2025-07-12)

### Feat

- enhance file name transformer with additional options (#555)

### Fix

- update syntax highlighting transformer styles (#558)
- typo in astro-paper-v5 blog post (#556)

## v5.4.3 (2025-06-21)

### Fix

- remove time from post datetime display (#546)
- update edit post link styling and text (#545)
- typos across codebase (#543)

## v5.4.2 (2025-06-15)

### Fix

- broken typography in about layout (#541)
- remove extra padding in fenced code blocks (#540)

## v5.4.1 (2025-06-14)

### Fix

- make heading anchors in article visible on mobile (#537)

### Refactor

- update tailwind typography css overrides (#538)

## v5.4.0 (2025-06-14)

### Feat

- add file name transformer for fenced code blocks (#535)
- add RTL language support (#531)
- add Shiki transformers for better syntax highlighting (#534)

### Fix

- replace broken prev/next links with correct paths (#533)

## v5.3.0 (2025-06-11)

### Feat

- improve back-to-top button behavior (#520)(#527)

### Fix

- navigation flicker on Android when in dark mode (#494)
- add scroll offset for anchor targets (#506)
- add types for constants to avoid type errors when empty (#501)
- update heading alignment and font-size (#473)

### Refactor

- extract redundant max-width into utility (#525)
- use new astro env (#507)

## v5.2.0 (2025-03-22)

### Feat

- add global and per-post timezone support (#491)

### Fix

- adjust nav bar alignment in heading (#492)
- ensure only one search bar is displayed on nav link clicks (#489)

## v5.1.1 (2025-03-20)

### Fix

- initial light mode flash in dark mode (#488)
- broken editPost link and update editPost logic  (#487)
- prevent overflow by adding line breaks in table codes (#485)

## v5.1.0 (2025-03-18)

### Feat

- allow blog posts to be organized by subdirectories

### Other

- update blog post creation guide
- upgrade astro and dependencies

## v5.0.1 (2025-03-12)

### Fix

- update docker-compose (#475)
- update import location in giscus example (#474)
- add an option to disable dynamic OG image generation (#476)
- remove unused `ogImage` size validation (#462)
- correct Google Fonts API URL construction for proper weight fetching
- align vertically in header nav (#460)
- add font-weight param in og image card style (#453)

### Docs

- update giscus integration guide for AstroPaper v5 (#472)
- update color schemes guide for AstroPaper v5 (#469)
- update LaTeX equations guide in Astro blog posts (#461)

## v5.0.0 (2025-03-08)

### Feat

- add pagefind for static search (#458)
- update back button logic

### Fix

- ignore  in eslint
- update blog table padding
- remove unused back url in the card url
- show light/dark button according to site setting
- add author url in Google JSON-LD conditionally

### Refactor

- remove react dependency for UI interactions (#457)
- separate config and constants
- update import alias in files
- update blog directory to `src/data/blog`


- upgrade to Tailwind CSS v4
- update import alias to `@/*`
- upgrade Astro to v5 and related packages
