# Extractable Superdesign DraftComponents

## NavBar
- Source: `src/components/Header.astro`
- Category: layout
- Description: Top nav with emoji+title brand, Chinese links, search/archive icons, theme toggle, hairline Hr
- Extractable props: `activeItem` (string, default: "home")
- Hardcoded: brand text `🧠 doit's blog`, menu items 文章/标签/哔哔/关于/日志, SVG icons, all CSS, wavy `active-nav` underline
- Notes: No logo image — identity is emoji + text. Do not invent a mark.

## Footer
- Source: `src/components/Footer.astro`
- Category: layout
- Description: Hairline + social icons + copyright
- Extractable props: none required
- Hardcoded: "Copyright © {year} | All rights reserved.", social icon SVGs, layout

## Breadcrumb
- Source: `src/components/Breadcrumb.astro`
- Category: layout
- Description: 首页 » section crumbs
- Extractable props: none (page-derived); skip unless needed
- Hardcoded: 首页 label, » separators

## MainShell
- Source: `src/layouts/Main.astro`
- Category: layout
- Description: Narrow max-w-3xl page title + italic description wrapper
- Extractable props: `pageTitle` (string, default: "页面"), `pageDesc` (string, default: "")
- Hardcoded: typography classes, max-w-app
- Notes: Product showcase should NOT be forced into this narrow column for the 3D stage; keep Header/Footer, allow a wider stage.

## Card
- Source: `src/components/Card.astro`
- Category: basic
- Description: Text list post row (accent title, date, description)
- Skip extraction: too simple; inline in drafts

## LinkButton
- Source: `src/components/LinkButton.astro`
- Category: basic
- Description: Hover-accent link
- Skip extraction: primitive

## Tag
- Source: `src/components/Tag.astro`
- Category: basic
- Description: Dashed #tag chip
- Skip extraction: primitive

## Socials
- Source: `src/components/Socials.astro`
- Category: basic
- Description: GitHub/Mail/RSS icon row
- Skip extraction: already inside Footer
