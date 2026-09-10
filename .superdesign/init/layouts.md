# Layouts — doit's blog

Document shell: `Layout.astro` wraps `<html>`/`<head>`/`<body>` and a slot. Header and Footer are composed per page, not inside Layout. Most list pages use `Main.astro` (breadcrumb + h1 + italic desc + slot) constrained to `max-w-app` (`max-w-3xl`).

Identity: header brand is `🧠 {SITE.title}` text+emoji. No logo image file.

---

## Layout (document shell)
- Path: `src/layouts/Layout.astro`
- Renders: html lang zh-CN, meta/OG, ClientRouter, Poppins font, theme script, nav-progress bar, slot.

```astro
---
import { ClientRouter } from "astro:transitions";
import { PUBLIC_GOOGLE_SITE_VERIFICATION } from "astro:env/client";
import { Font } from "astro:assets";
import { SITE } from "@/config";
import "@/styles/global.css";

export interface Props {
  title?: string;
  author?: string;
  profile?: string;
  description?: string;
  ogImage?: string;
  canonicalURL?: string;
  pubDatetime?: Date;
  modDatetime?: Date | null;
  scrollSmooth?: boolean;
}

const {
  title = SITE.title,
  author = SITE.author,
  profile = SITE.profile,
  description = SITE.desc,
  ogImage = SITE.ogImage ? `/${SITE.ogImage}` : "/og.png",
  canonicalURL = new URL(Astro.url.pathname, Astro.url),
  pubDatetime,
  modDatetime,
  scrollSmooth = false,
} = Astro.props;

const socialImageURL = new URL(ogImage, Astro.url);
---

<!doctype html>
<html
  dir={SITE.dir}
  lang=`${SITE.lang ?? "en"}`
  class={`${scrollSmooth && "scroll-smooth"}`}
  transition:animate="none"
>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link
      rel="icon"
      href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>"
    />
    <link rel="canonical" href={canonicalURL} />
    <title>{title}</title>
    <meta name="description" content={description} />
    <Font cssVariable="--font-poppins" preload />
    <script is:inline src="/toggle-theme.js"></script>
  </head>
  <body>
    <div id="nav-progress" class="nav-progress" transition:persist="nav-progress" hidden></div>
    <slot />
  </body>
</html>
```

(Full file also includes OG/Twitter meta, JSON-LD, sitemap/rss links, and view-transition font persistence scripts. Nav progress is a 2px accent bar.)

---

## Header (top nav)
- Path: `src/components/Header.astro`
- Renders: brand `🧠 doit's blog`, hamburger on mobile, links 文章/标签/哔哔/关于/日志, archives+search icon buttons, theme toggle, Hr.

```astro
---
import Hr from "./Hr.astro";
import IconX from "@/assets/icons/IconX.svg";
import IconMoon from "@/assets/icons/IconMoon.svg";
import IconSearch from "@/assets/icons/IconSearch.svg";
import IconArchive from "@/assets/icons/IconArchive.svg";
import IconSunHigh from "@/assets/icons/IconSunHigh.svg";
import IconMenuDeep from "@/assets/icons/IconMenuDeep.svg";
import LinkButton from "./LinkButton.astro";
import { SITE } from "@/config";

const { pathname } = Astro.url;
const currentPath =
  pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
const isActive = (path: string) => {
  const currentPathArray = currentPath.split("/").filter(p => p.trim());
  const pathArray = path.split("/").filter(p => p.trim());
  return currentPath === path || currentPathArray[0] === pathArray[0];
};
---

<header>
  <div id="nav-container" class="mx-auto flex max-w-app flex-col items-center justify-between sm:flex-row">
    <div id="top-nav-wrap" class="relative flex w-full items-baseline justify-between bg-background p-4 sm:items-center sm:py-6">
      <a href="/" data-astro-prefetch="load" class="absolute py-1 text-xl leading-8 font-semibold whitespace-nowrap transition-colors hover:text-accent sm:static sm:my-auto sm:text-2xl sm:leading-none">
        🧠 {SITE.title}
      </a>
      <nav id="nav-menu" class="flex w-full flex-col items-center sm:ms-2 sm:flex-row sm:justify-end sm:space-x-4 sm:py-0">
        <button id="menu-btn" class="focus-outline self-end p-2 sm:hidden" aria-label="Open Menu" aria-expanded="false" aria-controls="menu-items">
          <IconX id="close-icon" class="hidden" />
          <IconMenuDeep id="menu-icon" />
        </button>
        <ul id="menu-items" class:list={[
          "mt-4 grid w-44 grid-cols-2 place-content-center gap-2",
          "[&>li>a]:block [&>li>a]:px-4 [&>li>a]:py-3 [&>li>a]:text-center [&>li>a]:font-medium [&>li>a]:hover:text-accent sm:[&>li>a]:px-2 sm:[&>li>a]:py-1",
          "hidden",
          "sm:mt-0 sm:flex sm:w-auto sm:gap-x-5 sm:gap-y-0",
        ]}>
          <li class="col-span-2"><a href="/posts" class:list={{ "active-nav": isActive("/posts") }}>文章</a></li>
          <li class="col-span-2"><a href="/tags" class:list={{ "active-nav": isActive("/tags") }}>标签</a></li>
          <li class="col-span-2"><a href="/bb" class:list={{ "active-nav": isActive("/bb") }}>哔哔</a></li>
          <li class="col-span-2"><a href="/about" class:list={{ "active-nav": isActive("/about") }}>关于</a></li>
          <li class="col-span-2"><a href="/changelog" class:list={{ "active-nav": isActive("/changelog") }}>日志</a></li>
          <!-- archives LinkButton + search LinkButton + theme-btn -->
        </ul>
      </nav>
    </div>
  </div>
  <Hr />
</header>
```

Active item gets class `active-nav` (wavy magenta underline). Full source is in `src/components/Header.astro` (202 lines including menu toggle script).

---

## Footer
- Path: `src/components/Footer.astro`
- Renders: Hr, social icons (row-reverse on sm), "Copyright © {year} | All rights reserved."

```astro
---
import Hr from "./Hr.astro";
import Socials from "./Socials.astro";

const currentYear = new Date().getFullYear();

export interface Props {
  noMarginTop?: boolean;
}

const { noMarginTop = false } = Astro.props;
---

<footer class:list={["w-full", { "mt-auto": !noMarginTop }]}>
  <Hr noPadding />
  <div class="flex flex-col items-center justify-between py-6 sm:flex-row-reverse sm:py-4">
    <Socials centered />
    <div class="my-2 flex flex-col items-center whitespace-nowrap sm:flex-row">
      <span>Copyright &#169; {currentYear}</span>
      <span class="hidden sm:inline">&nbsp;|&nbsp;</span>
      <span>All rights reserved.</span>
    </div>
  </div>
</footer>
```

---

## Main (inner page wrapper)
- Path: `src/layouts/Main.astro`
- Renders: optional Breadcrumb, `<main max-w-app>` with h1 + italic pageDesc + slot.

```astro
---
import Breadcrumb from "@/components/Breadcrumb.astro";
import { SITE } from "@/config";

interface StringTitleProp {
  pageTitle: string;
  pageDesc?: string;
  showBreadcrumb?: boolean;
}

interface ArrayTitleProp {
  pageTitle: [string, string];
  titleTransition: string;
  pageDesc?: string;
  showBreadcrumb?: boolean;
}

export type Props = StringTitleProp | ArrayTitleProp;

const { props } = Astro;
const showBreadcrumb = props.showBreadcrumb ?? true;
const backUrl = SITE.showBackButton ? Astro.url.pathname : "/";
---

{showBreadcrumb && <Breadcrumb />}
<main
  data-backUrl={backUrl}
  id="main-content"
  class:list={["mx-auto w-full max-w-app px-4 pb-4", !showBreadcrumb && "mt-6"]}
>
  {
    "titleTransition" in props ? (
      <h1 class="text-2xl font-semibold sm:text-3xl">
        {props.pageTitle[0]}
        <span transition:name={props.titleTransition}>{props.pageTitle[1]}</span>
      </h1>
    ) : (
      <h1 class="text-2xl font-semibold sm:text-3xl">{props.pageTitle}</h1>
    )
  }
  <p class="mt-2 mb-6 italic">{props.pageDesc}</p>
  <slot />
</main>
```

---

## Breadcrumb
- Path: `src/components/Breadcrumb.astro`
- Renders: `首页 » 文章 » …` with Chinese labels.

```astro
---
const titlePathMap: Record<string, string> = {
  posts: "文章",
  tags: "标签",
  about: "关于",
  archives: "归档",
};
const pathTitleMap = Object.fromEntries(Object.entries(titlePathMap).map(([key, value]) => [value, key]))
const currentUrlPath = Astro.url.pathname.replace(/\/+$/, "");
const breadcrumbList = currentUrlPath.split("/").slice(1);
if (titlePathMap[breadcrumbList[0]]) {
  breadcrumbList.splice(0, 1, titlePathMap[breadcrumbList[0]]);
}
---

<nav class="mx-auto mt-8 mb-2 w-full max-w-app px-4" aria-label="breadcrumb">
  <ul class="font-normal [&>li]:inline [&>li:not(:last-child)>a]:hover:opacity-100">
    <li>
      <a href="/" class="opacity-80">首页</a>
      <span aria-hidden="true" class="opacity-80">&raquo;</span>
    </li>
    <!-- remaining crumbs -->
  </ul>
</nav>
```

---

## AboutLayout
- Path: `src/layouts/AboutLayout.astro`
- Header + Breadcrumb + prose main + dashed hr + Comments + Footer.

---

## PostDetails
- Path: `src/layouts/PostDetails.astro`
- Header + BackButton + article (title, Datetime, EditPost, `.app-prose` content, tags, prev/next) + Comments + Footer + BackToTopButton. Full-bleed lightgallery on images.
