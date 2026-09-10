# Page dependency trees — doit's blog

Candidate `--context-file` sets. Apply PAYLOAD BUDGET (~900 line trim) when generating.

## `/` (Home)
Entry: `src/pages/index.astro`
Dependencies:
- `src/layouts/Layout.astro`
  - `src/config.ts`
  - `src/styles/global.css`
    - `src/styles/typography.css`
- `src/components/Header.astro`
  - `src/components/Hr.astro`
  - `src/components/LinkButton.astro`
  - `src/assets/icons/IconX.svg`
  - `src/assets/icons/IconMoon.svg`
  - `src/assets/icons/IconSearch.svg`
  - `src/assets/icons/IconArchive.svg`
  - `src/assets/icons/IconSunHigh.svg`
  - `src/assets/icons/IconMenuDeep.svg`
  - `src/config.ts`
- `src/components/Footer.astro`
  - `src/components/Hr.astro`
  - `src/components/Socials.astro`
    - `src/constants.ts`
    - `src/components/LinkButton.astro`
    - `src/assets/icons/IconGitHub.svg`
    - `src/assets/icons/IconMail.svg`
    - `src/assets/icons/IconRss.svg`
- `src/components/Socials.astro`
- `src/components/LinkButton.astro`
- `src/components/Card.astro`
  - `src/components/Datetime.astro`
  - `src/utils/slugify.ts`
  - `src/utils/getPath.ts`
- `src/components/Hr.astro`
- `src/utils/getSortedPosts.ts`
- `src/assets/icons/IconArrowRight.svg`
- `src/assets/images/cute_bear.png`
- `src/config.ts`
- `src/constants.ts`

## `/posts` (Article list)
Entry: `src/pages/posts/[...page].astro`
Dependencies:
- `src/layouts/Layout.astro`
- `src/layouts/Main.astro`
  - `src/components/Breadcrumb.astro`
  - `src/config.ts`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/Card.astro`
- `src/components/Pagination.astro`
  - `src/components/LinkButton.astro`
  - `src/assets/icons/IconArrowLeft.svg`
  - `src/assets/icons/IconArrowRight.svg`
- `src/utils/getSortedPosts.ts`
- `src/config.ts`

## `/posts/[...slug]` (Post detail)
Entry: `src/pages/posts/[...slug]/index.astro`
Dependencies:
- `src/layouts/PostDetails.astro`
  - `src/layouts/Layout.astro`
  - `src/components/Header.astro`
  - `src/components/Footer.astro`
  - `src/components/Comments.tsx`
    - `src/constants.ts`
  - `src/components/Tag.astro`
  - `src/components/Datetime.astro`
  - `src/components/EditPost.astro`
  - `src/components/BackButton.astro`
  - `src/components/BackToTopButton.astro`
  - `src/config.ts`
  - `src/styles` (prose via `.app-prose` + lightgallery CSS)

## `/about`
Entry: `src/pages/about.md`
Dependencies:
- `src/layouts/AboutLayout.astro`
  - `src/layouts/Layout.astro`
  - `src/components/Header.astro`
  - `src/components/Footer.astro`
  - `src/components/Breadcrumb.astro`
  - `src/components/Comments.tsx`

## `/bb` (Microblog)
Entry: `src/pages/bb.astro`
Dependencies:
- `src/layouts/Layout.astro`
- `src/layouts/Main.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/MicroBlog.astro`
- `src/styles/notion.css`
- `src/utils/notion.js`

## `/search`
Entry: `src/pages/search.astro`
Dependencies:
- `src/layouts/Layout.astro`
- `src/layouts/Main.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`

## `/archives`
Entry: `src/pages/archives/index.astro`
Dependencies:
- `src/layouts/Layout.astro`
- `src/layouts/Main.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/Card.astro`
- `src/utils/getPostsByGroupCondition.ts`

## `/tags`
Entry: `src/pages/tags/index.astro`
Dependencies:
- `src/layouts/Layout.astro`
- `src/layouts/Main.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/Tag.astro`

## `/404`
Entry: `src/pages/404.astro`
Dependencies:
- `src/layouts/Layout.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/LinkButton.astro`

## `/digital` (NEW — everyday consumer electronics showcase)
Does not exist. Will reuse:
- `src/layouts/Layout.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/styles/global.css`
- `.superdesign/design-system.md`
Anchor sibling for style: `/` (`src/pages/index.astro`) — same shell, hero + sections.
