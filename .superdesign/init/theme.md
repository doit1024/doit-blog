# Theme tokens — doit's blog (AstroPaper fork)

## Part 1 — Compact token summary

### Product
Personal Chinese blog (`doit's blog` / `doit 杜伊特`) at https://blog.doooit.me/. Astro 5 + Tailwind CSS v4. Light/dark via `data-theme` on `<html>`. Accent is magenta/pink, not a typical tech blue.

### Color palette

| Token | Light (`:root` / `html[data-theme="light"]`) | Dark (`html[data-theme="dark"]`) |
| --- | --- | --- |
| `--background` | `#fffdfd` cream-white | `#232323` charcoal |
| `--foreground` | `#222e36` slate | `#e9edf1` off-white |
| `--accent` | `#d3006a` magenta | `#ff78c8` pink |
| `--muted` | `#f1bad4` pale pink | `#715566` dusty mauve |
| `--border` | `#e3a9c6` rose | `#86436b` plum |

Mapped to Tailwind via `@theme inline`: `--color-background`, `--color-foreground`, `--color-accent`, `--color-muted`, `--color-border`.

### Typography
- **Body**: `-apple-system, var(--font-poppins, ui-sans-serif), Arial, Helvetica, sans-serif`
- **Brand font**: Poppins (Astro Font, CSS var `--font-poppins`)
- **Language**: `zh-CN`, LTR
- **Hero H1**: `text-3xl font-bold` / `sm:text-4xl`
- **Section H2**: `text-2xl font-semibold tracking-wide`
- **Page H1 (Main)**: `text-2xl font-semibold` / `sm:text-3xl`
- **Card title**: `text-lg font-medium`
- **Nav brand**: `text-xl font-semibold` / `sm:text-2xl`
- **Body copy**: default size, `text-foreground/80` for secondary, italic used for taglines
- **Prose**: `.app-prose` (Tailwind typography). Strong text uses accent. Links: dashed underline, hover accent. List markers: accent.

### Spacing & layout
- **App max width**: `max-w-3xl` via `@utility max-w-app` — content is a **narrow reading column**, not a full-bleed dashboard
- **Page padding**: `px-4` on `section`/`footer` and Main
- **Header**: `p-4` / `sm:py-6`
- **Hero**: `pt-8 pb-6`, `gap-12` with optional right-side illustration
- **Section**: `pt-12 pb-6`
- **Card list items**: `my-6`
- **Footer**: `py-6` / `sm:py-4`

### Radius, borders, shadows
- No global radius scale. Cards are text-list items (no boxed cards on home).
- Borders: `border-border` (1px). MicroBlog uses `rounded-lg border border-border p-6`.
- Back-to-top: `rounded-full shadow-xl`
- Code: `rounded bg-muted/75 p-1`
- Active nav: wavy underline `decoration-wavy decoration-2 underline-offset-4`

### Breakpoints (Tailwind defaults)
- `sm`: 40rem — header becomes row, hero illustration appears
- `md`: 48rem — back-to-top `md:right-8`
- Narrow column (`max-w-3xl`) is the primary layout, not a 12-col grid

### Motion
- View transitions: `::view-transition-group(*)` 120ms; reduced-motion: none
- Theme icons: scale/rotate between moon and sun
- Social icons: `hover:rotate-6`
- Nav progress bar: 2px accent, indeterminate translate
- Back-to-top: opacity + translate, 500ms; conic-gradient accent progress ring
- Tag hover: slight `-translate-y`
- `prefers-reduced-motion` respected on view transitions

### Interaction
- Focus: dashed 2px accent outline, `outline-offset-1`
- Selection: `selection:bg-accent/75 selection:text-background`
- Links/buttons: `hover:text-accent`
- Cursor pointer on enabled buttons

---

## Part 2 — Raw source dumps

### `src/styles/global.css`

```css
@import "tailwindcss";
@import "./typography.css";

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

:root,
html[data-theme="light"] {
  --background: #fffdfd;
  --foreground: #222e36;
  --accent: #d3006a;
  --muted: #f1bad4;
  --border: #e3a9c6;
}

html[data-theme="dark"] {
  --background: #232323;
  --foreground: #e9edf1;
  --accent: #ff78c8;
  --muted: #715566;
  --border: #86436b;
}

body {
  font-family:
    -apple-system, var(--font-poppins, ui-sans-serif), Arial, Helvetica,
    sans-serif;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-muted: var(--muted);
  --color-border: var(--border);
}

@layer base {
  * {
    @apply border-border outline-accent/75;
    scrollbar-width: auto;
    scrollbar-color: var(--color-muted) transparent;
  }
  html {
    @apply overflow-y-scroll;
  }
  body {
    @apply flex min-h-svh flex-col bg-background text-foreground selection:bg-accent/75 selection:text-background;
  }
  a,
  button {
    @apply outline-offset-1 outline-accent focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-dashed;
  }
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
  section,
  footer {
    @apply mx-auto max-w-app px-4;
  }
}

@utility max-w-app {
  @apply max-w-3xl;
}

.active-nav {
  @apply underline decoration-wavy decoration-2 underline-offset-4;
}

:target {
  scroll-margin-block: 1rem;
}

.figure-image figcaption {
  @apply text-center;
}
```

No `tailwind.config.ts` — Tailwind v4 is configured via Vite plugin `@tailwindcss/vite` and CSS-first `@theme inline` in `global.css`.
