# Design system — doit's blog + 日常消费电子展示

## Product context

**doit's blog** is a personal Chinese blog (AstroPaper fork) by frontend engineer **doit / 杜伊特**. Existing JTBD: read posts, skim tags/archives, leave comments, check microblog (`/bb`). Site: https://blog.doooit.me/

**New page:** `/digital` — 日常消费电子陈列柜。不是电商结账页，也不是日本品牌专场；是博客里的「每天在用的数码」：用可旋转的 3D 模型让读者看清形态，再配短评和规格。品类：手机、耳机、手表、笔记本电脑、相机。

Jobs to be done:
1. 进入页面立刻看到一台可交互的 3D 产品，而不是扁平海报墙。
2. 在品类之间切换（手机 / 耳机 / 手表 / 笔记本 / 相机），舞台上的模型跟着换。
3. 扫一眼规格、上手感受、相关博文入口，然后回到阅读流。

Key pages: Home `/`, Posts, Tags, About, BB, **Digital showcase (new)**.

## Visual identity (hard constraints)

Keep the blog's existing language. Do not invent a separate "Apple Store" or neon-cyber brand.

- **Logo / wordmark:** `🧠 doit's blog` (emoji + Poppins semibold). No separate logo file. Never replace with an invented SVG mark or initials-only lockup.
- **Fonts:** Poppins + system UI (`-apple-system, var(--font-poppins), Arial, Helvetica, sans-serif`). No serif display, no decorative display type; body stays Poppins/system.
- **Light:** background `#fffdfd`, foreground `#222e36`, accent `#d3006a`, muted `#f1bad4`, border `#e3a9c6`
- **Dark:** background `#232323`, foreground `#e9edf1`, accent `#ff78c8`, muted `#715566`, border `#86436b`
- **Selection / focus:** accent wash; dashed 2px accent outline
- **Active nav:** wavy underline `decoration-wavy decoration-2`
- **Radius:** sparse. Circles for icon buttons. Soft `rounded-lg` only on product spec cards / 3D stage well. No heavy 24px app-store cards everywhere.
- **Layout shell:** Header (max-w-3xl inner, full-width bar) + Footer. The 3D stage may break out of `max-w-3xl` to `max-w-5xl` or full-bleed muted well, then specs return to the reading column.
- **Language:** Chinese UI copy. Product names can mix EN model names (e.g. Sony WH-1000XM5).

## 3D showcase patterns

Priority: **3D model as the hero**, not a photo grid.

- Center stage: large orbiting / drag-to-rotate product (CSS 3D, canvas-like frame, or a well-lit studio pedestal). Show orbit hint: "拖动旋转".
- Pedestal: circular muted disc + soft accent rim light, not a busy environment.
- Category rail: horizontal chips under or beside the stage — 手机 · 耳机 · 手表 · 笔记本 · 相机. Selected chip uses accent + wavy or solid underline consistent with `active-nav`.
- Specs panel: 2–3 spec rows (尺寸 / 重量 / 亮点) in the blog's text hierarchy (`text-lg font-medium` titles, `opacity-80` meta), not dashboard KPI tiles.
- Supporting products: a sparse row of silhouette thumbnails that swap the 3D subject — still secondary to the stage.
- Motion: slow idle yaw; hover lift on chips (`-translate-y-0.5` like tags); respect `prefers-reduced-motion` (static 3/4 view).
- Dark mode: stage sits on `#232323` with pink rim `#ff78c8`; light mode cream studio `#fffdfd` with magenta rim.

## Content (placeholder catalog)

Editorial 「日常在用的数码」shelf — everyday consumer gadgets a blogger actually carries, mixed brands, not a Japan-only or car-brand collection:

| Category | Product | Note |
| --- | --- | --- |
| 手机 | Pixel 9 Pro / 日常旗舰 | 口袋里的主力机 |
| 耳机 | 头戴降噪耳机 | 通勤和写作 |
| 手表 | 智能手表 | 通知、睡眠、运动 |
| 笔记本 | 轻薄笔记本 | 出门写代码 |
| 相机 | 便携相机 | 随手拍生活 |

Copy voice: first-person blogger, short, concrete. No marketing slogans, no fake prices/checkout.

## Motion / interaction (from existing blog)

- Theme toggle moon/sun rotate
- Social `hover:rotate-6`
- 120ms view transitions
- Nav progress 2px accent
- Back-to-top conic accent ring

New page may add: 3D orbit, chip crossfade of model, subtle pedestal reflection.

## Do not

- Do not use blue/cyan tech gradients, glassmorphism stacks, or Inter/Roboto as primary.
- Do not add cart, checkout, or rating-star e-commerce chrome.
- Do not drop Header/Footer or the 🧠 wordmark.
- Do not theme this as a Japanese specialty shop, Nissan automotive page, or Apple Store clone.
- Do not fill the page with a 2D product photo mosaic; 3D stage is mandatory.
