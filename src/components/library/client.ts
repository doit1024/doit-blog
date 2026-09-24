import {
  entryMatches,
  LIBRARY_PAGE_SIZE,
  type LibraryEntry,
} from "@/components/library/entries";
import { STAR_TOTAL, starDisplay } from "@/components/library/stars";

type Payload = {
  pageSize: number;
  items: LibraryEntry[];
};

function readPayload(root: HTMLElement): Payload | null {
  const node =
    root.querySelector("[data-library-payload]") ??
    document.querySelector("[data-library-payload]");
  if (!node?.textContent) return null;
  try {
    const data = JSON.parse(node.textContent) as Partial<Payload>;
    if (!Array.isArray(data.items)) return null;
    const pageSize = Number(data.pageSize);
    return {
      pageSize:
        Number.isFinite(pageSize) && pageSize > 0
          ? pageSize
          : LIBRARY_PAGE_SIZE,
      items: data.items,
    };
  } catch {
    return null;
  }
}

function bindImage(img: HTMLImageElement) {
  const mark = () => img.closest("[data-poster]")?.classList.add("is-text");
  img.addEventListener("error", mark);
  if (img.complete && img.naturalWidth === 0) mark();
}

function createCard(entry: LibraryEntry): HTMLLIElement {
  const li = document.createElement("li");
  li.dataset.mediaCard = "";
  li.dataset.type = entry.type;
  li.dataset.dropped = entry.dropped ? "1" : "0";

  const card = document.createElement("button");
  card.type = "button";
  card.className = "library-card";
  card.dataset.libraryOpen = "";
  card.dataset.mediaId = entry.id;
  card.dataset.title = entry.title;
  card.dataset.meta = entry.meta;
  card.dataset.cover = entry.cover ?? "";
  card.dataset.url = entry.url ?? "";
  card.dataset.note = entry.note;
  card.dataset.rating = entry.rating == null ? "" : String(entry.rating);
  card.dataset.created = entry.created ?? "";

  const poster = document.createElement("div");
  poster.className = "poster";
  poster.dataset.poster = "";

  if (entry.cover) {
    const img = document.createElement("img");
    img.src = entry.cover;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    bindImage(img);
    poster.append(img);
  }

  const fallback = document.createElement("p");
  fallback.className = "fallback";
  fallback.setAttribute("aria-hidden", "true");
  const span = document.createElement("span");
  span.textContent = entry.title;
  fallback.append(span);
  poster.append(fallback);

  const name = document.createElement("p");
  name.className = "library-name";
  name.textContent = entry.title;
  card.append(poster, name);

  if (entry.meta) {
    const meta = document.createElement("p");
    meta.className = "library-meta";
    meta.textContent = entry.meta;
    card.append(meta);
  }

  const action = document.createElement("span");
  action.className = "library-card-action";
  action.textContent = "查看详情";
  card.append(action);

  li.append(card);
  return li;
}

type DialogFields = {
  title: string;
  meta: string;
  cover: string | null;
  url: string | null;
  note: string;
  rating: number | null;
  created: string | null;
};

function readRating(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function safeCover(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/")) return value;
  return safeHttpUrl(value);
}

function fieldsFromTrigger(trigger: HTMLElement): DialogFields {
  return {
    title: trigger.dataset.title ?? "",
    meta: trigger.dataset.meta ?? "",
    cover: safeCover(trigger.dataset.cover),
    url: safeHttpUrl(trigger.dataset.url),
    note: trigger.dataset.note ?? "",
    rating: readRating(trigger.dataset.rating),
    created: trigger.dataset.created?.trim() || null,
  };
}

const STAR_PATH =
  "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

function starPath(kind: "fill" | "outline"): SVGPathElement {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", STAR_PATH);
  path.setAttribute("class", kind === "fill" ? "is-fill" : "is-outline");
  return path;
}

function starSvg(kind: "full" | "empty" | "half"): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("library-star", `is-${kind}`);

  if (kind === "half") {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clip = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "clipPath"
    );
    clip.id = "library-star-half";
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", "12");
    rect.setAttribute("height", "24");
    clip.append(rect);
    defs.append(clip);
    svg.append(defs, starPath("outline"));
    const fill = starPath("fill");
    fill.setAttribute("clip-path", "url(#library-star-half)");
    svg.append(fill);
    return svg;
  }

  svg.append(starPath(kind === "full" ? "fill" : "outline"));
  return svg;
}

function paintStars(host: HTMLElement, filled: number, half: boolean) {
  host.replaceChildren();
  const empty = STAR_TOTAL - filled - (half ? 1 : 0);
  for (let index = 0; index < filled; index += 1) host.append(starSvg("full"));
  if (half) host.append(starSvg("half"));
  for (let index = 0; index < empty; index += 1) host.append(starSvg("empty"));
}

function formatCreated(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const hasTime = /T\d{2}:\d{2}/.test(value);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(hasTime
      ? {
          hour: "2-digit" as const,
          minute: "2-digit" as const,
          hourCycle: "h23" as const,
        }
      : {}),
  }).format(date);
}

function linkLabel(url: string): string {
  try {
    if (new URL(url).hostname.endsWith("douban.com")) return "在豆瓣查看";
  } catch {
    /* keep the generic label */
  }
  return "打开链接";
}

function focusableIn(dialog: HTMLElement): HTMLElement[] {
  return [
    ...dialog.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input, textarea, select, [tabindex]"
    ),
  ].filter(el => el.tabIndex >= 0 && !el.closest("[hidden]"));
}

function renderPoster(poster: HTMLElement, fields: DialogFields) {
  poster.classList.remove("is-text");
  poster.replaceChildren();
  if (fields.cover) {
    const img = document.createElement("img");
    img.src = fields.cover;
    img.alt = "";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    bindImage(img);
    poster.append(img);
  }
  const fallback = document.createElement("p");
  fallback.className = "fallback";
  fallback.setAttribute("aria-hidden", "true");
  const span = document.createElement("span");
  span.textContent = fields.title;
  fallback.append(span);
  poster.append(fallback);
}

function bindModal(root: HTMLElement) {
  if (root.dataset.modal === "1") return;
  const dialog = root.querySelector<HTMLDialogElement>(
    "dialog[data-library-dialog]"
  );
  if (!dialog) return;
  root.dataset.modal = "1";

  const title = dialog.querySelector<HTMLElement>("[data-dialog-title]");
  const meta = dialog.querySelector<HTMLElement>("[data-dialog-meta]");
  const rating = dialog.querySelector<HTMLElement>("[data-dialog-rating]");
  const stars = dialog.querySelector<HTMLElement>("[data-dialog-stars]");
  const ratingText = dialog.querySelector<HTMLElement>(
    "[data-dialog-rating-text]"
  );
  const starsVisual = dialog.querySelector<HTMLElement>(
    "[data-dialog-stars-visual]"
  );
  const note = dialog.querySelector<HTMLElement>("[data-dialog-note]");
  const link = dialog.querySelector<HTMLAnchorElement>("[data-dialog-link]");
  const created = dialog.querySelector<HTMLElement>("[data-dialog-created]");
  const createdValue = dialog.querySelector<HTMLTimeElement>(
    "[data-dialog-created-value]"
  );
  const poster = dialog.querySelector<HTMLElement>("[data-dialog-poster]");
  const closeButton = dialog.querySelector<HTMLButtonElement>(
    "[data-library-dialog-close]"
  );

  let lastFocus: HTMLElement | null = null;

  const fill = (fields: DialogFields) => {
    if (title) title.textContent = fields.title;
    if (meta) {
      meta.textContent = fields.meta;
      meta.hidden = !fields.meta;
    }
    if (rating && stars && starsVisual) {
      const display = fields.rating == null ? null : starDisplay(fields.rating);
      if (!display) {
        rating.hidden = true;
        stars.removeAttribute("aria-label");
        if (ratingText) ratingText.textContent = "";
        starsVisual.replaceChildren();
      } else {
        rating.hidden = false;
        stars.setAttribute("aria-label", display.ariaLabel);
        if (ratingText) ratingText.textContent = display.ariaLabel;
        paintStars(starsVisual, display.filled, display.half);
      }
    }
    if (note) {
      const text = fields.note.trim();
      note.textContent = text || "还没有短评。";
      note.classList.toggle("is-empty", !text);
    }
    if (link) {
      if (fields.url) {
        link.href = fields.url;
        link.textContent = linkLabel(fields.url);
        link.hidden = false;
      } else {
        link.hidden = true;
        link.removeAttribute("href");
        link.textContent = "";
      }
    }
    if (created && createdValue) {
      const text = fields.created ? formatCreated(fields.created) : null;
      if (text && fields.created) {
        createdValue.textContent = text;
        createdValue.dateTime = fields.created;
        created.hidden = false;
      } else {
        created.hidden = true;
        createdValue.textContent = "";
        createdValue.removeAttribute("datetime");
      }
    }
    if (poster) renderPoster(poster, fields);
  };

  const open = (trigger: HTMLElement) => {
    fill(fieldsFromTrigger(trigger));
    lastFocus = trigger;
    if (!dialog.open) dialog.showModal();
    dialog.focus({ preventScroll: true });
  };

  root.addEventListener("click", event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest<HTMLElement>("[data-library-open]");
    if (!trigger || !root.contains(trigger)) return;
    open(trigger);
  });

  closeButton?.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    const back = lastFocus;
    lastFocus = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
  });

  dialog.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const items = focusableIn(dialog);
    if (items.length === 0) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const outside = !(active instanceof Node) || !dialog.contains(active);
    if (event.shiftKey) {
      if (outside || active === first || active === dialog) {
        event.preventDefault();
        last.focus();
      }
      return;
    }
    if (outside || active === last || active === dialog) {
      event.preventDefault();
      first.focus();
    }
  });
}

function bindDomOnly(root: HTMLElement) {
  const cards = [...root.querySelectorAll<HTMLElement>("[data-media-card]")];
  const empty = root.querySelector<HTMLElement>("[data-library-empty]");
  const more = root.querySelector<HTMLButtonElement>("[data-library-more]");
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>(
      ".library-filters [data-filter]"
    ),
  ];
  if (more) more.hidden = true;

  const apply = (filter: string) => {
    let visible = 0;
    for (const card of cards) {
      const type = card.dataset.type ?? "";
      const dropped = card.dataset.dropped === "1";
      const show =
        filter === "dropped"
          ? dropped
          : !dropped && (filter === "all" || type === filter);
      card.hidden = !show;
      if (show) visible += 1;
    }
    if (empty) empty.hidden = visible !== 0;
  };

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter ?? "all";
      for (const peer of buttons) {
        peer.setAttribute("aria-pressed", peer === button ? "true" : "false");
      }
      apply(filter);
    });
  }

  for (const img of root.querySelectorAll<HTMLImageElement>("img")) {
    bindImage(img);
  }
  apply("all");
}

export function bootLibrary() {
  const root = document.querySelector<HTMLElement>("[data-library]");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  bindModal(root);

  const grid = root.querySelector<HTMLElement>("[data-library-grid]");
  const payload = readPayload(root);
  if (!grid || !payload) {
    bindDomOnly(root);
    return;
  }

  const more = root.querySelector<HTMLButtonElement>("[data-library-more]");
  const empty = root.querySelector<HTMLElement>("[data-library-empty]");
  const buttons = [
    ...document.querySelectorAll<HTMLButtonElement>(
      ".library-filters [data-filter]"
    ),
  ];

  let filter = "all";
  let shown = grid.querySelectorAll("[data-media-card]").length;

  const pool = () => payload.items.filter(item => entryMatches(item, filter));

  const sync = () => {
    const total = pool().length;
    if (more) more.hidden = shown >= total;
    if (empty) empty.hidden = total !== 0;
  };

  const appendNext = () => {
    const next = pool().slice(shown, shown + payload.pageSize);
    for (const entry of next) grid.append(createCard(entry));
    shown += next.length;
    sync();
  };

  const apply = (nextFilter: string) => {
    filter = nextFilter;
    const first = pool().slice(0, payload.pageSize);
    grid.replaceChildren(...first.map(createCard));
    shown = first.length;
    sync();
  };

  more?.addEventListener("click", appendNext);

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const next = button.dataset.filter ?? "all";
      for (const peer of buttons) {
        peer.setAttribute("aria-pressed", peer === button ? "true" : "false");
      }
      apply(next);
    });
  }

  for (const img of grid.querySelectorAll<HTMLImageElement>("img")) {
    bindImage(img);
  }

  sync();
}
