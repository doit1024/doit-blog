import {
  entryMatches,
  LIBRARY_PAGE_SIZE,
  type LibraryEntry,
} from "@/components/library/entries";

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

  const label = entry.meta ? `${entry.title}，${entry.meta}` : entry.title;
  const card = entry.url
    ? document.createElement("a")
    : document.createElement("div");
  card.className = "library-card";
  if (entry.note) card.title = entry.note;
  if (card instanceof HTMLAnchorElement && entry.url) {
    card.href = entry.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", label);
  }

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

  li.append(card);
  return li;
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
