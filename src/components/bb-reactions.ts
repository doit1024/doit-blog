import {
  MAX_REACTION_IDS,
  REACTION_EMOJIS,
  canonicalReactionEmoji,
  emptyCounts,
  isReactionEmoji,
  normalizePostId,
  reactionAriaLabel,
  reactionLabel,
  votedStorageKey,
  type ReactionCounts,
  type ReactionEmoji,
} from "@/utils/bb-reactions";

const PICKER_ID = "bb-rx-picker";

let listening = false;
let hydrateScheduled = false;
let picker: HTMLElement | null = null;
let activeNote: HTMLElement | null = null;
let activeTrigger: HTMLButtonElement | null = null;

const countsByNote = new WeakMap<HTMLElement, ReactionCounts>();
const pendingByNote = new WeakMap<HTMLElement, Set<ReactionEmoji>>();
const votedByNote = new WeakMap<HTMLElement, Set<ReactionEmoji>>();

function readVoted(postId: string, emoji: ReactionEmoji): boolean {
  try {
    return localStorage.getItem(votedStorageKey(postId, emoji)) === "1";
  } catch {
    return false;
  }
}

function writeVoted(postId: string, emoji: ReactionEmoji) {
  try {
    localStorage.setItem(votedStorageKey(postId, emoji), "1");
  } catch {
    // Private mode still has the server marker.
  }
}

function clearVoted(postId: string, emoji: ReactionEmoji) {
  try {
    localStorage.removeItem(votedStorageKey(postId, emoji));
  } catch {
    // The next GET still replaces this cache.
  }
}

/** In-memory votes. localStorage only seeds the first paint; the server wins later. */
function votedFor(note: HTMLElement): Set<ReactionEmoji> {
  let voted = votedByNote.get(note);
  if (!voted) {
    voted = new Set();
    const postId = postIdOf(note);
    if (postId) {
      for (const emoji of REACTION_EMOJIS) {
        if (readVoted(postId, emoji)) voted.add(emoji);
      }
    }
    votedByNote.set(note, voted);
  }
  return voted;
}

function setVoted(note: HTMLElement, emoji: ReactionEmoji, voted: boolean) {
  const postId = postIdOf(note);
  const set = votedFor(note);
  if (voted) {
    set.add(emoji);
    if (postId) writeVoted(postId, emoji);
  } else {
    set.delete(emoji);
    if (postId) clearVoted(postId, emoji);
  }
}

function countsFor(note: HTMLElement): ReactionCounts {
  let counts = countsByNote.get(note);
  if (!counts) {
    counts = emptyCounts();
    countsByNote.set(note, counts);
  }
  return counts;
}

function pendingFor(note: HTMLElement): Set<ReactionEmoji> {
  let pending = pendingByNote.get(note);
  if (!pending) {
    pending = new Set();
    pendingByNote.set(note, pending);
  }
  return pending;
}

function postIdOf(note: HTMLElement): string | null {
  const raw = note.dataset.postId;
  if (!raw) return null;
  return normalizePostId(raw);
}

function chipsHost(note: HTMLElement): HTMLElement | null {
  const host = note.querySelector(".bb-rx-chips");
  return host instanceof HTMLElement ? host : null;
}

function statusOf(note: HTMLElement): HTMLElement | null {
  const status = note.querySelector(".bb-rx-status");
  return status instanceof HTMLElement ? status : null;
}

function setStatus(note: HTMLElement, message: string) {
  const status = statusOf(note);
  if (status) status.textContent = message;
}

function chipFor(
  host: ParentNode,
  emoji: ReactionEmoji
): HTMLButtonElement | null {
  for (const button of host.querySelectorAll<HTMLButtonElement>(
    ".bb-rx-chip"
  )) {
    if (button.dataset.emoji === emoji) return button;
  }
  return null;
}

function createChip(emoji: ReactionEmoji): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bb-rx-chip";
  button.dataset.emoji = emoji;
  const icon = document.createElement("span");
  icon.className = "bb-rx-emoji";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = emoji;
  const count = document.createElement("span");
  count.className = "bb-rx-count";
  count.dataset.count = "0";
  button.append(icon, count);
  return button;
}

function updateChip(
  button: HTMLButtonElement,
  emoji: ReactionEmoji,
  count: number,
  voted: boolean,
  pending: boolean
) {
  const safe = count > 0 ? count : 0;
  const span = button.querySelector(".bb-rx-count");
  if (span) {
    span.textContent = safe > 0 ? String(safe) : "";
    span.setAttribute("data-count", String(safe));
  }
  button.setAttribute("aria-pressed", voted ? "true" : "false");
  button.setAttribute("aria-label", reactionAriaLabel(emoji, safe, voted));
  if (pending) button.dataset.pending = "1";
  else delete button.dataset.pending;
  if (pending) button.setAttribute("aria-busy", "true");
  else button.removeAttribute("aria-busy");
}

function syncChips(note: HTMLElement) {
  const postId = postIdOf(note);
  const host = chipsHost(note);
  if (!postId || !host) return;
  const counts = countsFor(note);
  const pending = pendingFor(note);

  for (const emoji of REACTION_EMOJIS) {
    const count = counts[emoji];
    const voted = votedFor(note).has(emoji);
    const existing = chipFor(host, emoji);
    if (count <= 0 && !voted && !pending.has(emoji)) {
      existing?.remove();
      continue;
    }
    const chip = existing ?? createChip(emoji);
    const anchor = [
      ...host.querySelectorAll<HTMLButtonElement>(".bb-rx-chip"),
    ].find(button => {
      const other = button.dataset.emoji;
      return (
        isReactionEmoji(other) &&
        REACTION_EMOJIS.indexOf(other) > REACTION_EMOJIS.indexOf(emoji)
      );
    });
    host.insertBefore(chip, anchor ?? null);
    updateChip(chip, emoji, count, voted, pending.has(emoji));
  }
}

function applyServerCounts(note: HTMLElement, raw: unknown) {
  if (!raw || typeof raw !== "object") return;
  const record = raw as Record<string, unknown>;
  const counts = countsFor(note);
  const pending = pendingFor(note);
  for (const emoji of REACTION_EMOJIS) {
    if (pending.has(emoji)) continue;
    const value = record[emoji];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      continue;
    }
    counts[emoji] = Math.min(Math.floor(value), 1_000_000_000);
  }
  syncChips(note);
}

function mineList(value: unknown): ReactionEmoji[] {
  if (!Array.isArray(value)) return [];
  const list: ReactionEmoji[] = [];
  for (const item of value) {
    const emoji = canonicalReactionEmoji(item);
    if (emoji && !list.includes(emoji)) list.push(emoji);
  }
  return list;
}

function applyServerMine(note: HTMLElement, emojis: readonly ReactionEmoji[]) {
  const pending = pendingFor(note);
  const next = new Set(emojis);
  for (const emoji of REACTION_EMOJIS) {
    if (pending.has(emoji)) continue;
    setVoted(note, emoji, next.has(emoji));
  }
  syncChips(note);
}

function ensurePicker(): HTMLElement {
  if (picker?.isConnected) return picker;
  const el = document.createElement("div");
  el.id = PICKER_ID;
  el.className = "bb-rx-picker";
  el.hidden = true;
  el.setAttribute("role", "group");
  el.setAttribute("aria-label", "选择反应");
  for (const emoji of REACTION_EMOJIS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bb-rx-option";
    button.dataset.emoji = emoji;
    button.textContent = emoji;
    button.setAttribute("aria-label", reactionLabel(emoji));
    el.append(button);
  }
  document.body.append(el);
  picker = el;
  return el;
}

function markPickerVotes(note: HTMLElement) {
  const el = ensurePicker();
  const postId = postIdOf(note);
  const voted = votedFor(note);
  el.querySelectorAll<HTMLButtonElement>(".bb-rx-option").forEach(button => {
    const emoji = button.dataset.emoji;
    const pressed = Boolean(
      postId && isReactionEmoji(emoji) && voted.has(emoji)
    );
    button.setAttribute("aria-pressed", pressed ? "true" : "false");
    if (isReactionEmoji(emoji)) {
      button.setAttribute(
        "aria-label",
        pressed ? `已${reactionLabel(emoji)}，再点取消` : reactionLabel(emoji)
      );
    }
  });
}

function placePicker(trigger: HTMLElement) {
  const el = ensurePicker();
  const margin = 8;
  const rect = trigger.getBoundingClientRect();
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  let left = rect.left;
  if (left + width > window.innerWidth - margin) {
    left = window.innerWidth - margin - width;
  }
  left = Math.max(margin, left);
  let top = rect.bottom + 6;
  if (
    top + height > window.innerHeight - margin &&
    rect.top - height - 6 > margin
  ) {
    top = rect.top - height - 6;
  }
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function closePicker(restoreFocus: boolean) {
  const trigger = activeTrigger;
  if (picker) picker.hidden = true;
  trigger?.setAttribute("aria-expanded", "false");
  activeNote = null;
  activeTrigger = null;
  if (restoreFocus && trigger?.isConnected) trigger.focus();
}

function openPicker(note: HTMLElement, trigger: HTMLButtonElement) {
  if (activeNote === note && picker && !picker.hidden) {
    closePicker(true);
    return;
  }
  closePicker(false);
  const el = ensurePicker();
  activeNote = note;
  activeTrigger = trigger;
  markPickerVotes(note);
  trigger.setAttribute("aria-controls", PICKER_ID);
  trigger.setAttribute("aria-expanded", "true");
  el.hidden = false;
  placePicker(trigger);
  const first = el.querySelector("button");
  if (first instanceof HTMLElement) first.focus();
}

async function react(note: HTMLElement, emoji: ReactionEmoji) {
  const postId = postIdOf(note);
  if (!postId) return;
  closePicker(false);
  const pending = pendingFor(note);
  if (pending.has(emoji)) return;

  const removing = votedFor(note).has(emoji);
  const counts = countsFor(note);
  const previous = counts[emoji];
  pending.add(emoji);
  counts[emoji] = removing ? Math.max(0, previous - 1) : previous + 1;
  setVoted(note, emoji, !removing);
  note.dataset.bbRxLocal = "1";
  setStatus(note, "");
  syncChips(note);

  let focusAfter = false;
  try {
    const response = await fetch("/api/bb/reactions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        postId,
        emoji,
        action: removing ? "remove" : "add",
      }),
    });

    let data: { counts?: unknown; voted?: unknown } | null = null;
    try {
      data = (await response.json()) as { counts?: unknown; voted?: unknown };
    } catch {
      data = null;
    }

    pending.delete(emoji);
    if (response.ok) {
      if (typeof data?.voted === "boolean") setVoted(note, emoji, data.voted);
      if (data?.counts) applyServerCounts(note, data.counts);
      setStatus(note, "");
      focusAfter = true;
      return;
    }

    counts[emoji] = previous;
    setVoted(note, emoji, removing);
    if (response.status === 409 && data) {
      if (typeof data.voted === "boolean") setVoted(note, emoji, data.voted);
      if (data.counts) applyServerCounts(note, data.counts);
      setStatus(note, "");
      return;
    }

    note.dataset.bbRxLocal = "0";
    setStatus(
      note,
      response.status === 429 ? "请稍后再试" : "没有记上，请再试一次"
    );
  } catch {
    counts[emoji] = previous;
    setVoted(note, emoji, removing);
    note.dataset.bbRxLocal = "0";
    setStatus(note, "网络异常，请再试一次");
  } finally {
    pending.delete(emoji);
    syncChips(note);
    if (focusAfter) {
      const chip = chipFor(chipsHost(note) ?? note, emoji);
      (chip ?? note.querySelector<HTMLButtonElement>(".bb-rx-add"))?.focus();
    }
  }
}

async function hydrate(root: ParentNode) {
  const notes = [...root.querySelectorAll<HTMLElement>(".bb-note")].flatMap(
    note => {
      const postId = postIdOf(note);
      return postId ? [{ note, postId }] : [];
    }
  );
  const ids = [...new Set(notes.map(item => item.postId))];

  for (let index = 0; index < ids.length; index += MAX_REACTION_IDS) {
    const batch = ids.slice(index, index + MAX_REACTION_IDS);
    try {
      const response = await fetch(
        `/api/bb/reactions?ids=${encodeURIComponent(batch.join(","))}`,
        { headers: { accept: "application/json" } }
      );
      if (!response.ok) continue;
      const data = (await response.json()) as {
        reactions?: unknown;
        mine?: unknown;
      };
      if (!data.reactions || typeof data.reactions !== "object") continue;
      const reactions = data.reactions as Record<string, unknown>;
      const mine =
        data.mine && typeof data.mine === "object"
          ? (data.mine as Record<string, unknown>)
          : null;
      for (const item of notes) {
        if (!batch.includes(item.postId)) continue;
        if (item.note.dataset.bbRxLocal === "1") continue;
        applyServerCounts(item.note, reactions[item.postId]);
        if (mine) applyServerMine(item.note, mineList(mine[item.postId]));
      }
    } catch {
      // The note stays readable. Chips stay at whatever we already showed.
    }
  }
}

function scheduleHydrate() {
  if (hydrateScheduled) return;
  hydrateScheduled = true;
  const run = () => {
    hydrateScheduled = false;
    void hydrate(document);
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 1200 });
  } else {
    requestAnimationFrame(() => requestAnimationFrame(run));
  }
}

function onClick(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
    return;
  }
  if (!(event.target instanceof Element)) return;

  const option = event.target.closest(".bb-rx-option");
  if (option instanceof HTMLButtonElement) {
    event.preventDefault();
    const emoji = canonicalReactionEmoji(option.dataset.emoji);
    if (activeNote && emoji) void react(activeNote, emoji);
    return;
  }

  const trigger = event.target.closest(".bb-rx-add");
  if (trigger instanceof HTMLButtonElement) {
    event.preventDefault();
    const note = trigger.closest(".bb-note");
    if (note instanceof HTMLElement) openPicker(note, trigger);
    return;
  }

  const chip = event.target.closest(".bb-rx-chip");
  if (chip instanceof HTMLButtonElement) {
    event.preventDefault();
    const note = chip.closest(".bb-note");
    const emoji = canonicalReactionEmoji(chip.dataset.emoji);
    if (note instanceof HTMLElement && emoji) void react(note, emoji);
    return;
  }

  if (picker && !picker.hidden) closePicker(false);
}

function onKey(event: KeyboardEvent) {
  if (!picker || picker.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closePicker(true);
    return;
  }
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  const buttons = [
    ...picker.querySelectorAll<HTMLButtonElement>(".bb-rx-option"),
  ];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  const delta = event.key === "ArrowRight" ? 1 : -1;
  buttons[(index + delta + buttons.length) % buttons.length]?.focus();
}

export function bootBbReactions() {
  if (!document.querySelector(".bb-note[data-post-id]")) return;
  document.querySelectorAll<HTMLElement>(".bb-note").forEach(note => {
    if (!postIdOf(note)) return;
    countsFor(note);
    syncChips(note);
  });
  if (!listening) {
    listening = true;
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    const follow = () => {
      if (!picker || picker.hidden) return;
      if (!activeTrigger?.isConnected) {
        closePicker(false);
        return;
      }
      placePicker(activeTrigger);
    };
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, true);
    document.addEventListener("astro:before-swap", () => closePicker(false));
  }
  scheduleHydrate();
}
