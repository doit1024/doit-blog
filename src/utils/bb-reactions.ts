/** GitHub issue reactions, in picker order. */
export const REACTION_EMOJIS = [
  "👍",
  "👎",
  "😄",
  "🎉",
  "😕",
  "❤️",
  "🚀",
  "👀",
] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type ReactionCounts = Record<ReactionEmoji, number>;

const LABELS: Record<ReactionEmoji, string> = {
  "👍": "点赞",
  "👎": "反对",
  "😄": "开心",
  "🎉": "庆祝",
  "😕": "困惑",
  "❤️": "喜欢",
  "🚀": "火箭",
  "👀": "关注",
};

/** Notion page ids, with or without hyphens, become one KV key shape. */
const POST_ID = /^[0-9a-f]{32}$/;

export const WINDOW_SEC = 10;
export const DAILY_LIMIT = 60;
export const MAX_REACTION_IDS = 50;

/**
 * KV rejects `expirationTtl` below 60 seconds. The 10s window is the bucket
 * inside the key; the TTL only garbage-collects the marker.
 */
export const KV_MIN_TTL_SEC = 60;

export function isReactionEmoji(value: unknown): value is ReactionEmoji {
  return REACTION_EMOJIS.some(emoji => emoji === value);
}

/** Map a posted emoji onto the whitelist, including ❤ without the variation selector. */
export function canonicalReactionEmoji(value: unknown): ReactionEmoji | null {
  if (typeof value !== "string") return null;
  if (isReactionEmoji(value)) return value;
  const folded = value.trim().replace(/\uFE0F/g, "");
  for (const emoji of REACTION_EMOJIS) {
    if (emoji.replace(/\uFE0F/g, "") === folded) return emoji;
  }
  return null;
}

export function reactionLabel(emoji: ReactionEmoji): string {
  return LABELS[emoji];
}

export function normalizePostId(id: string): string | null {
  const normalized = id.trim().replace(/-/g, "").toLowerCase();
  return POST_ID.test(normalized) ? normalized : null;
}

export function emptyCounts(): ReactionCounts {
  return {
    "👍": 0,
    "👎": 0,
    "😄": 0,
    "🎉": 0,
    "😕": 0,
    "❤️": 0,
    "🚀": 0,
    "👀": 0,
  };
}

export function parseCounts(raw: string | null): ReactionCounts {
  const counts = emptyCounts();
  if (!raw) return counts;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return counts;
  }
  if (!parsed || typeof parsed !== "object") return counts;

  const record = parsed as Record<string, unknown>;
  for (const emoji of REACTION_EMOJIS) {
    const value = record[emoji];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      counts[emoji] = Math.min(Math.floor(value), 1_000_000_000);
    }
  }
  return counts;
}

export function reactionAriaLabel(
  emoji: ReactionEmoji,
  count: number,
  voted: boolean
): string {
  const name = voted ? `已${LABELS[emoji]}` : LABELS[emoji];
  return `${name}，当前 ${count}`;
}

export function votedStorageKey(postId: string, emoji: ReactionEmoji): string {
  return `bb:rx:voted:${postId}:${emoji}`;
}

export function countsKey(postId: string): string {
  return `bb:rx:${postId}`;
}

export function windowBucket(nowMs: number): number {
  return Math.floor(nowMs / 1000 / WINDOW_SEC);
}

/** UTC day. The daily cap resets at 00:00 UTC. */
export function dayBucket(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function windowKey(
  ipHash: string,
  postId: string,
  bucket: number
): string {
  return `bb:rl:${ipHash}:${postId}:${bucket}`;
}

export function dayKey(ipHash: string, day: string): string {
  return `bb:rl:day:${ipHash}:${day}`;
}

export function secondsUntilNextWindow(nowMs: number): number {
  const windowMs = WINDOW_SEC * 1000;
  const elapsed = nowMs % windowMs;
  const remainMs = elapsed === 0 ? windowMs : windowMs - elapsed;
  return Math.max(1, Math.ceil(remainMs / 1000));
}

export async function hashIp(ip: string, pepper: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${ip}${pepper}`)
  );
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
