import {
  MAX_REACTION_IDS,
  isReactionEmoji,
  normalizePostId,
  reactionAriaLabel,
  votedStorageKey,
  type ReactionEmoji,
} from "@/utils/bb-reactions";

let listening = false;
let hydrateScheduled = false;

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
    // Private mode still has the server rate limit.
  }
}

function countOf(button: HTMLButtonElement): number {
  const raw = button.querySelector(".bb-rx-count")?.getAttribute("data-count");
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

function setCount(button: HTMLButtonElement, count: number) {
  const safe = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  const span = button.querySelector(".bb-rx-count");
  if (span) {
    span.textContent = safe > 0 ? String(safe) : "";
    span.setAttribute("data-count", String(safe));
  }
  const emoji = button.dataset.emoji;
  if (!isReactionEmoji(emoji)) return;
  const voted = button.getAttribute("aria-pressed") === "true";
  button.setAttribute("aria-label", reactionAriaLabel(emoji, safe, voted));
}

function markVoted(button: HTMLButtonElement, voted: boolean) {
  button.setAttribute("aria-pressed", voted ? "true" : "false");
  button.setAttribute("aria-disabled", voted ? "true" : "false");
  button.classList.toggle("is-voted", voted);
  setCount(button, countOf(button));
}

function statusOf(note: HTMLElement): HTMLElement | null {
  const status = note.querySelector(".bb-rx-status");
  return status instanceof HTMLElement ? status : null;
}

function setStatus(note: HTMLElement, message: string) {
  const status = statusOf(note);
  if (status) status.textContent = message;
}

function postIdOf(note: HTMLElement): string | null {
  const raw = note.dataset.postId;
  if (!raw) return null;
  return normalizePostId(raw);
}

function applyStoredVotes(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".bb-note").forEach(note => {
    const postId = postIdOf(note);
    if (!postId) return;
    note.querySelectorAll<HTMLButtonElement>(".bb-rx").forEach(button => {
      const emoji = button.dataset.emoji;
      if (!isReactionEmoji(emoji)) return;
      if (readVoted(postId, emoji)) markVoted(button, true);
    });
  });
}

function applyCounts(note: HTMLElement, counts: unknown) {
  if (!counts || typeof counts !== "object") return;
  const record = counts as Record<string, unknown>;
  note.querySelectorAll<HTMLButtonElement>(".bb-rx").forEach(button => {
    if (button.dataset.pending === "1") return;
    const emoji = button.dataset.emoji;
    if (!isReactionEmoji(emoji)) return;
    const value = record[emoji];
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    setCount(button, value);
  });
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
      const data = (await response.json()) as { reactions?: unknown };
      if (!data.reactions || typeof data.reactions !== "object") continue;
      const reactions = data.reactions as Record<string, unknown>;
      for (const item of notes) {
        if (!batch.includes(item.postId)) continue;
        if (item.note.dataset.bbRxLocal === "1") continue;
        applyCounts(item.note, reactions[item.postId]);
      }
    } catch {
      // Counts stay hidden. The post itself is already in the static HTML.
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

async function react(button: HTMLButtonElement) {
  if (button.getAttribute("aria-disabled") === "true") return;
  if (button.dataset.pending === "1") return;

  const note = button.closest(".bb-note");
  if (!(note instanceof HTMLElement)) return;
  const postId = postIdOf(note);
  const emoji = button.dataset.emoji;
  if (!postId || !isReactionEmoji(emoji)) return;
  if (readVoted(postId, emoji)) {
    markVoted(button, true);
    return;
  }

  const previous = countOf(button);
  button.dataset.pending = "1";
  button.setAttribute("aria-busy", "true");
  note.dataset.bbRxLocal = "1";
  setCount(button, previous + 1);
  setStatus(note, "");

  try {
    const response = await fetch("/api/bb/reactions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ postId, emoji }),
    });

    if (response.ok) {
      let counts: unknown;
      try {
        const data = (await response.json()) as { counts?: unknown };
        counts = data.counts;
      } catch {
        counts = undefined;
      }
      writeVoted(postId, emoji);
      delete button.dataset.pending;
      if (counts) applyCounts(note, counts);
      markVoted(button, true);
      setStatus(note, "");
      return;
    }

    setCount(button, previous);
    note.dataset.bbRxLocal = "0";
    setStatus(
      note,
      response.status === 429 ? "请稍后再试" : "没有记上，请再试一次"
    );
  } catch {
    setCount(button, previous);
    note.dataset.bbRxLocal = "0";
    setStatus(note, "网络异常，请再试一次");
  } finally {
    delete button.dataset.pending;
    button.removeAttribute("aria-busy");
  }
}

function onClick(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
    return;
  }
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest(".bb-rx");
  if (!(button instanceof HTMLButtonElement)) return;
  event.preventDefault();
  void react(button);
}

export function bootBbReactions() {
  if (!document.querySelector(".bb-note[data-post-id]")) return;
  applyStoredVotes(document);
  if (!listening) {
    listening = true;
    document.addEventListener("click", onClick);
  }
  scheduleHydrate();
}
