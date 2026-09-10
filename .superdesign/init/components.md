# Shared UI primitives — doit's blog

No shadcn/ui or component library. Custom Astro components in `src/components/`. Tailwind v4 utility classes. Brand mark in header is emoji `🧠` + site title text (no logo image file).

---

## LinkButton
- Path: `src/components/LinkButton.astro`
- Description: Anchor or disabled span with hover-accent; used for nav icons, pagination, CTAs.
- Props: `id`, `href`, `class`, `ariaLabel`, `title`, `disabled`, `redirect` (default true → `_self`, false → `_blank`), `prefetch`

```astro
---
export interface Props {
  id?: string;
  href: string;
  class?: string;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  redirect?: boolean;
  prefetch?: "hover" | "tap" | "viewport" | "load" | boolean;
}

const {
  id,
  href,
  class: className = "",
  ariaLabel,
  title,
  disabled = false,
  redirect = true,
  prefetch,
} = Astro.props;

const prefetchValue =
  prefetch === undefined
    ? undefined
    : prefetch === true
      ? ""
      : String(prefetch);
---

{
  disabled ? (
    <span
      id={id}
      class:list={["group inline-block", className]}
      title={title}
      aria-disabled={disabled}
    >
      <slot />
    </span>
  ) : (
    <a
      id={id}
      {href}
      target={redirect ? "_self" : "_blank"}
      class:list={["group inline-block hover:text-accent", className]}
      aria-label={ariaLabel}
      title={title}
      data-astro-prefetch={prefetchValue}
    >
      <slot />
    </a>
  )
}
```

---

## Card
- Path: `src/components/Card.astro`
- Description: Text-only post list item (title link, datetime, description). Not a boxed card.
- Props: CollectionEntry<"blog"> plus `variant` `"h2" | "h3"`

```astro
---
import { slugifyStr } from "@/utils/slugify";
import type { CollectionEntry } from "astro:content";
import { getPath } from "@/utils/getPath";
import Datetime from "./Datetime.astro";

export interface Props extends CollectionEntry<"blog"> {
  variant?: "h2" | "h3";
}

const { variant = "h2", data, id, filePath } = Astro.props;

const { title, description, pubDatetime, modDatetime, timezone } = data;

const headerProps = {
  style: { viewTransitionName: slugifyStr(title) },
  class: "text-lg font-medium decoration-dashed hover:underline",
};
---

<li class="my-6">
  <a
    href={getPath(id, filePath)}
    class="inline-block text-lg font-medium text-accent decoration-dashed underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0"
  >
    {
      variant === "h2" ? (
        <h2 {...headerProps}>{title}</h2>
      ) : (
        <h3 {...headerProps}>{title}</h3>
      )
    }
  </a>
  <Datetime {pubDatetime} {modDatetime} {timezone} />
  <p>{description}</p>
</li>
```

---

## Hr
- Path: `src/components/Hr.astro`
- Description: Full-width hairline using `--border`.
- Props: `noPadding`, `ariaHidden`

```astro
---
export interface Props {
  noPadding?: boolean;
  ariaHidden?: boolean;
}

const { noPadding = false, ariaHidden = true } = Astro.props;
---

<div class:list={["mx-auto max-w-app", noPadding ? "px-0" : "px-4"]}>
  <hr class="border-border" aria-hidden={ariaHidden} />
</div>
```

---

## Tag
- Path: `src/components/Tag.astro`
- Description: `# tagName` dashed-underline chip linking to `/tags/{tag}/`.
- Props: `tag`, `tagName`, `size` `"sm" | "lg"`

```astro
---
export interface Props {
  tag: string;
  tagName: string;
  size?: "sm" | "lg";
}

const { tag, tagName, size = "sm" } = Astro.props;
---

<li
  class:list={[
    "group inline-block group-hover:cursor-pointer",
    "underline decoration-dashed focus-visible:no-underline",
    size === "sm" ? "my-1 underline-offset-4" : "mx-1 my-3 underline-offset-8",
  ]}
>
  <a
    href={`/tags/${tag}/`}
    transition:name={tag}
    class:list={[
      "block pe-2 group-hover:text-accent focus-visible:p-1 ",
      { "text-sm group-hover:-translate-y-0.5": size === "sm", "text-lg group-hover:-translate-y-1": size === "lg" },
    ]}
  >
    # {tagName}
  </a>
</li>
```

---

## Datetime
- Path: `src/components/Datetime.astro`
- Description: `YYYY-MM-DD` in Asia/Shanghai, muted opacity.
- Props: `pubDatetime`, `modDatetime`, `timezone`, `size`, `class`

```astro
---
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { SITE } from "@/config";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('zh-cn');

export interface Props {
  class?: string;
  size?: "sm" | "lg";
  timezone: string | undefined;
  pubDatetime: string | Date;
  modDatetime: string | Date | undefined | null;
}

const {
  pubDatetime,
  modDatetime,
  size = "sm",
  class: className = "",
  timezone: postTimezone,
} = Astro.props;

const isModified = modDatetime && modDatetime > pubDatetime;

const datetime = dayjs(isModified ? modDatetime : pubDatetime).tz(
  postTimezone || SITE.timezone
);

const date = datetime.format("YYYY-MM-DD");
---

<div class:list={["flex items-center gap-x-2 opacity-80", className]}>
  <time
    class:list={["text-sm", { "sm:text-base": size === "lg" }]}
    datetime={datetime.toISOString()}>{date}
  </time>
</div>
```

---

## Pagination
- Path: `src/components/Pagination.astro`
- Description: Prev/next with chevrons, current/last page numbers.

```astro
---
import type { Page } from "astro";
import type { CollectionEntry } from "astro:content";
import IconArrowLeft from "@/assets/icons/IconArrowLeft.svg";
import IconArrowRight from "@/assets/icons/IconArrowRight.svg";
import LinkButton from "./LinkButton.astro";

export interface Props {
  page: Page<CollectionEntry<"blog">>;
}

const { page } = Astro.props;
---

{
  page.lastPage > 1 && (
    <nav class="mt-auto mb-8 flex justify-center" aria-label="Pagination">
      <LinkButton
        disabled={!page.url.prev}
        href={page.url.prev as string}
        class:list={["me-4 select-none", { "opacity-50": !page.url.prev }]}
        ariaLabel="Previous"
      >
        <IconArrowLeft class="inline-block rtl:rotate-180" />
        上一页
      </LinkButton>
      {page.currentPage} / {page.lastPage}
      <LinkButton
        disabled={!page.url.next}
        href={page.url.next as string}
        class:list={["ms-4 select-none", { "opacity-50": !page.url.next }]}
        ariaLabel="Next"
      >
        下一页
        <IconArrowRight class="inline-block rtl:rotate-180" />
      </LinkButton>
    </nav>
  )
}
```

---

## Socials
- Path: `src/components/Socials.astro`
- Description: GitHub / Mail / RSS icon row (stroke icons, hover rotate).
- Props: `centered`

```astro
---
import { SOCIALS } from "@/constants";
import LinkButton from "./LinkButton.astro";

export interface Props {
  centered?: boolean;
}

const { centered = false } = Astro.props;
---

<div class:list={["flex-wrap justify-center gap-1", { flex: centered }]}>
  {
    SOCIALS.map(social => (
      <LinkButton
        redirect={false}
        href={social.href}
        class="p-2 hover:rotate-6 sm:p-1"
        title={social.linkTitle}
      >
        <social.icon class="inline-block size-6 scale-125 fill-transparent stroke-current stroke-2 opacity-90 group-hover:fill-transparent sm:scale-110" />
        <span class="sr-only">{social.linkTitle}</span>
      </LinkButton>
    ))
  }
</div>
```

---

## BackButton
- Path: `src/components/BackButton.astro`
- Description: "返回" with chevron; href from sessionStorage `backUrl`.

```astro
---
import IconChevronLeft from "@/assets/icons/IconChevronLeft.svg";
import LinkButton from "./LinkButton.astro";
import { SITE } from "@/config";
---

{
  SITE.showBackButton && (
    <div class="mx-auto flex w-full max-w-app items-center justify-start px-2">
      <LinkButton
        id="back-button"
        href="/"
        class="focus-outline mt-8 mb-2 flex hover:text-foreground/75"
      >
        <IconChevronLeft class="inline-block size-6 rtl:rotate-180" />
        <span>返回</span>
      </LinkButton>
    </div>
  )
}
```

---

## BackToTopButton
- Path: `src/components/BackToTopButton.astro`
- Description: Fixed circular button with accent conic progress ring.

```astro
---
import IconChevronLeft from "@/assets/icons/IconChevronLeft.svg";
---

<div
  id="btt-btn-container"
  class:list={[
    "fixed end-4 bottom-8 z-50 inline-block md:right-8",
    "translate-y-14 opacity-0 transition duration-500",
  ]}
>
  <button
    data-button="back-to-top"
    class:list={[
      "relative bg-background px-1 py-0",
      "size-12 rounded-full shadow-xl",
    ]}
  >
    <span
      id="progress-indicator"
      class="absolute inset-0 -z-10 block size-12 scale-110 rounded-full bg-transparent"
    ></span>
    <IconChevronLeft class="inline-block rotate-90" />
  </button>
</div>
```

---

## CaptionImage
- Path: `src/components/CaptionImage.astro`
- Description: Figure + Astro Image + caption prefixed with `▲`.

```astro
---
import {
  Image,
  type LocalImageProps,
  type RemoteImageProps,
} from "astro:assets";
import { getOriginImage } from "@/utils/assets";

export interface Props {
  imageProps: LocalImageProps | RemoteImageProps;
  caption: string;
  class?: string;
}

const { imageProps, caption, class: className = "" } = Astro.props;
---

<figure
  class:list={["figure-image", className]}
  data-src={getOriginImage(imageProps.src as string)}
>
  <Image {...imageProps} />
  {caption && <figcaption>▲{caption}</figcaption>}
</figure>
```

---

## Comments
- Path: `src/components/Comments.tsx`
- Description: Giscus comments; follows light/dark theme.

```tsx
import Giscus, { type Theme } from "@giscus/react";
import { GISCUS } from "@/constants";
import { useEffect, useState } from "react";

interface CommentsProps {
  lightTheme?: Theme;
  darkTheme?: Theme;
}

export default function Comments({
  lightTheme = "light_tritanopia",
  darkTheme = "noborder_gray",
}: CommentsProps) {
  const [theme, setTheme] = useState(() => {
    const currentTheme = localStorage.getItem("theme");
    const browserTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    return currentTheme || browserTheme;
  });

  return (
    <div className="mt-8">
      <Giscus theme={theme === "light" ? lightTheme : darkTheme} {...GISCUS} />
    </div>
  );
}
```
