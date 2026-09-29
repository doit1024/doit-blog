const PHOTO = ".notion-asset-wrapper-image";

let listening = false;
let dialog: HTMLDialogElement | null = null;
let lightboxImg: HTMLImageElement | null = null;
let prevBtn: HTMLButtonElement | null = null;
let nextBtn: HTMLButtonElement | null = null;
let photos: HTMLImageElement[] = [];
let index = 0;
let lastFocus: HTMLElement | null = null;

function isBodyFigure(fig: Element): fig is HTMLElement {
  return (
    fig instanceof HTMLElement &&
    !fig.closest(".notion-bookmark") &&
    Boolean(fig.closest(".bb-note"))
  );
}

function bodyFigures(note: ParentNode): HTMLElement[] {
  return [...note.querySelectorAll(PHOTO)].filter(isBodyFigure);
}

function photoUnit(fig: HTMLElement): HTMLElement {
  const parent = fig.parentElement;
  if (
    parent &&
    parent.tagName === "A" &&
    !parent.classList.contains("notion-bookmark") &&
    !parent.closest(".notion-bookmark")
  ) {
    return parent;
  }
  return fig;
}

function labelFor(img: HTMLImageElement): string {
  const alt = img.alt.trim();
  if (alt && alt !== "notion image") return `查看大图：${alt}`;
  return "查看大图";
}

/** Same contain cap as the stylesheet, so a pending bitmap keeps its box. */
function reserveBox(img: HTMLImageElement) {
  if (img.dataset.bbBox === "1") return;
  const width = Number(img.getAttribute("width"));
  const height = Number(img.getAttribute("height"));
  if (!(width > 0) || !(height > 0)) return;
  img.dataset.bbBox = "1";
  if (!/(^|;)\s*aspect-ratio\s*:/.test(img.getAttribute("style") ?? "")) {
    img.style.aspectRatio = `${width} / ${height}`;
  }
  img.style.width = `min(${width}px, 320px, 70vw, calc(320px * ${width} / ${height}))`;
  img.style.height = "auto";
}

function prepareImage(img: HTMLImageElement) {
  if (img.dataset.bbPhoto === "1") return;
  img.dataset.bbPhoto = "1";
  reserveBox(img);
  img.tabIndex = 0;
  img.setAttribute("role", "button");
  img.setAttribute("aria-haspopup", "dialog");
  img.setAttribute("aria-label", labelFor(img));
}

function notionRoot(note: HTMLElement): HTMLElement | null {
  const root = note.querySelector(":scope .bb-note-content > .notion");
  return root instanceof HTMLElement ? root : null;
}

/** Pull every body image in the post into one 3-column grid. */
function groupNotePhotos(note: HTMLElement) {
  const figures = bodyFigures(note);
  note.dataset.bbPhotos =
    figures.length >= 2 ? "many" : figures.length === 1 ? "one" : "0";
  for (const fig of figures) {
    const img = fig.querySelector("img");
    if (img) prepareImage(img);
  }
  if (figures.length < 2 || note.querySelector(":scope .bb-photo-grid")) return;

  const notion = notionRoot(note);
  const units = figures.map(photoUnit);
  const grid = document.createElement("div");
  grid.className = "bb-photo-grid";
  const anchor = notion ? hoistTo(units[0], notion) : units[0];
  anchor.before(grid);
  for (const unit of units) grid.append(unit);
}

function hoistTo(node: HTMLElement, ancestor: HTMLElement): HTMLElement {
  let current = node;
  while (current.parentElement && current.parentElement !== ancestor) {
    current = current.parentElement;
  }
  return current;
}

export function groupBbPhotos(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".bb-note").forEach(note => {
    if (note.dataset.bbPhotosReady === "1") return;
    note.dataset.bbPhotosReady = "1";
    groupNotePhotos(note);
  });
}

function photosInNote(note: Element): HTMLImageElement[] {
  return bodyFigures(note).flatMap(fig => {
    const img = fig.querySelector("img");
    return img ? [img] : [];
  });
}

function icon(path: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function ensureDialog(): HTMLDialogElement {
  if (dialog?.isConnected && lightboxImg && prevBtn && nextBtn) return dialog;

  const el = document.createElement("dialog");
  el.className = "bb-lightbox";
  el.setAttribute("aria-label", "图片预览");
  el.innerHTML = `
    <button type="button" class="bb-lightbox-close" aria-label="关闭">${icon('<path d="M6 6l12 12M18 6L6 18"/>')}</button>
    <button type="button" class="bb-lightbox-prev" aria-label="上一张" hidden>${icon('<path d="M14 6l-6 6 6 6"/>')}</button>
    <button type="button" class="bb-lightbox-next" aria-label="下一张" hidden>${icon('<path d="M10 6l6 6-6 6"/>')}</button>
    <img class="bb-lightbox-img" alt="" />
  `;
  el.addEventListener("click", event => {
    if (event.target === el) el.close();
  });
  el.addEventListener("close", () => {
    document.documentElement.classList.remove("bb-lightbox-open");
    photos = [];
    const back = lastFocus;
    lastFocus = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
  });
  el.addEventListener("keydown", onDialogKey);
  el.querySelector(".bb-lightbox-close")?.addEventListener("click", () => {
    el.close();
  });
  el.querySelector(".bb-lightbox-prev")?.addEventListener("click", () => {
    step(-1);
  });
  el.querySelector(".bb-lightbox-next")?.addEventListener("click", () => {
    step(1);
  });
  document.body.append(el);
  dialog = el;
  lightboxImg = el.querySelector(".bb-lightbox-img");
  prevBtn = el.querySelector(".bb-lightbox-prev");
  nextBtn = el.querySelector(".bb-lightbox-next");
  return el;
}

function show(next: number) {
  if (!lightboxImg || !prevBtn || !nextBtn || photos.length === 0) return;
  index = (next + photos.length) % photos.length;
  const source = photos[index];
  lightboxImg.src = source.src;
  lightboxImg.alt = source.alt;
  lightboxImg.referrerPolicy = "no-referrer";
  const several = photos.length > 1;
  prevBtn.hidden = !several;
  nextBtn.hidden = !several;
}

function step(delta: number) {
  if (photos.length < 2) return;
  show(index + delta);
}

function focusableIn(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>("button, [href], [tabindex]"),
  ].filter(el => !el.hidden && el.tabIndex >= 0 && !el.closest("[hidden]"));
}

function onDialogKey(event: KeyboardEvent) {
  if (!dialog) return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    step(1);
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    step(-1);
    return;
  }
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
}

function openLightbox(img: HTMLImageElement) {
  const note = img.closest(".bb-note");
  if (!note) return;
  const list = photosInNote(note);
  const at = list.indexOf(img);
  if (at < 0) return;
  photos = list;
  const el = ensureDialog();
  show(at);
  lastFocus = img;
  document.documentElement.classList.add("bb-lightbox-open");
  if (!el.open) el.showModal();
  el.querySelector<HTMLButtonElement>(".bb-lightbox-close")?.focus({
    preventScroll: true,
  });
}

function closeLightbox() {
  if (dialog?.open) dialog.close();
}

function imageFromEvent(target: EventTarget | null): HTMLImageElement | null {
  if (!(target instanceof Element)) return null;
  const img = target.closest("img");
  if (!(img instanceof HTMLImageElement)) return null;
  const fig = img.closest(PHOTO);
  if (!fig || !isBodyFigure(fig)) return null;
  return img;
}

function onClick(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
    return;
  }
  const img = imageFromEvent(event.target);
  if (!img) return;
  event.preventDefault();
  openLightbox(img);
}

function onKey(event: KeyboardEvent) {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (dialog?.open) return;
  const img = imageFromEvent(event.target);
  if (!img) return;
  event.preventDefault();
  openLightbox(img);
}

export function bootBbPhotos() {
  if (!document.querySelector(".bb-note")) return;
  groupBbPhotos(document);
  if (listening) return;
  listening = true;
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  document.addEventListener("astro:before-swap", () => {
    closeLightbox();
  });
  document.addEventListener("bb:photos-refresh", () => {
    document
      .querySelectorAll<HTMLElement>(".bb-note")
      .forEach(note => delete note.dataset.bbPhotosReady);
    groupBbPhotos(document);
  });
}
