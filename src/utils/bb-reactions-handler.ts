import {
  DAILY_LIMIT,
  KV_MIN_TTL_SEC,
  MAX_REACTION_IDS,
  REACTION_EMOJIS,
  countsKey,
  dayBucket,
  dayKey,
  canonicalReactionEmoji,
  hashIp,
  mineKey,
  normalizePostId,
  parseCounts,
  reactionAction,
  secondsUntilNextWindow,
  windowBucket,
  windowKey,
  type ReactionCounts,
  type ReactionEmoji,
} from "@/utils/bb-reactions";

/** Public fallback so preview still runs before the secret exists. Set BB_RX_PEPPER in production. */
export const UNSET_PEPPER = "bb-rx-unset-pepper";

const MAX_BODY_BYTES = 2048;
const DAY_TTL_SEC = 60 * 60 * 48;
/** Local Wrangler still rejects `cacheTtl` under 60. Production's newer floor is 30; 60 works in both. */
const READ_CACHE_TTL = 60;

export interface ReactionsKv {
  get(key: string, options?: { cacheTtl?: number }): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
  delete(key: string): Promise<unknown>;
}

export function resolvePepper(secret: string | undefined): string {
  const trimmed = secret?.trim();
  return trimmed ? trimmed : UNSET_PEPPER;
}

export function clientIp(request: Request): string {
  const header = request.headers.get("cf-connecting-ip")?.trim();
  return header ? header : "unknown";
}

export async function handleReactionsRequest(
  request: Request,
  options: {
    kv: ReactionsKv | undefined;
    pepper: string;
    now?: () => number;
    ip?: string;
  }
): Promise<Response> {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "POST") {
    return json({ error: "method_not_allowed" }, 405, { allow: "GET, POST" });
  }
  if (!options.kv) {
    return json({ error: "reactions_unavailable" }, 500);
  }

  const ip = options.ip ?? clientIp(request);

  try {
    if (method === "GET") {
      return await handleGet(request, {
        kv: options.kv,
        pepper: options.pepper,
        ip,
      });
    }
    return await handlePost(request, {
      kv: options.kv,
      pepper: options.pepper,
      now: options.now ?? (() => Date.now()),
      ip,
    });
  } catch {
    return json({ error: "reactions_unavailable" }, 500);
  }
}

async function handleGet(
  request: Request,
  deps: { kv: ReactionsKv; pepper: string; ip: string }
): Promise<Response> {
  const raw = new URL(request.url).searchParams.get("ids");
  if (!raw?.trim()) return json({ error: "bad_request" }, 400);

  const parts = raw
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > MAX_REACTION_IDS) {
    return json({ error: "bad_request" }, 400);
  }

  const ids: string[] = [];
  for (const part of parts) {
    const id = normalizePostId(part);
    if (!id) return json({ error: "bad_request" }, 400);
    if (!ids.includes(id)) ids.push(id);
  }

  const ipHash = await hashIp(deps.ip, deps.pepper);
  const reactions: Record<string, ReactionCounts> = {};
  const mine: Record<string, ReactionEmoji[]> = {};
  await Promise.all(
    ids.map(async id => {
      const [raw, ...flags] = await Promise.all([
        deps.kv.get(countsKey(id), { cacheTtl: READ_CACHE_TTL }),
        ...REACTION_EMOJIS.map(emoji =>
          deps.kv.get(mineKey(ipHash, id, emoji), { cacheTtl: READ_CACHE_TTL })
        ),
      ]);
      reactions[id] = parseCounts(raw);
      mine[id] = REACTION_EMOJIS.filter((_, index) => flags[index] !== null);
    })
  );

  return json({ reactions, mine }, 200);
}

async function handlePost(
  request: Request,
  deps: {
    kv: ReactionsKv;
    pepper: string;
    now: () => number;
    ip: string;
  }
): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json({ error: "bad_request" }, 400);
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: "bad_request" }, 400);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (!body || typeof body !== "object") {
    return json({ error: "bad_request" }, 400);
  }

  const record = body as Record<string, unknown>;
  const postId =
    typeof record.postId === "string" ? normalizePostId(record.postId) : null;
  const emoji = canonicalReactionEmoji(record.emoji);
  const action = reactionAction(
    record.action === undefined ? "add" : record.action
  );
  if (!postId || !emoji || !action) {
    return json({ error: "bad_request" }, 400);
  }

  const nowMs = deps.now();
  const ipHash = await hashIp(deps.ip, deps.pepper);
  const votedKey = mineKey(ipHash, postId, emoji);
  const currentWindow = windowKey(ipHash, postId, emoji, windowBucket(nowMs));
  const today = dayKey(ipHash, dayBucket(nowMs));
  const countsStorageKey = countsKey(postId);
  const [windowHit, dayRaw, mineHit, countsRaw] = await Promise.all([
    deps.kv.get(currentWindow, { cacheTtl: READ_CACHE_TTL }),
    deps.kv.get(today, { cacheTtl: READ_CACHE_TTL }),
    deps.kv.get(votedKey, { cacheTtl: READ_CACHE_TTL }),
    deps.kv.get(countsStorageKey, { cacheTtl: READ_CACHE_TTL }),
  ]);

  const already = mineHit !== null;
  if (action === "add" && already) {
    return conflict("already_reacted", postId, emoji, true, countsRaw);
  }
  if (action === "remove" && !already) {
    return conflict("not_reacted", postId, emoji, false, countsRaw);
  }

  // The 10s bucket only blocks another add. Remove clears it so an immediate
  // re-add is not stuck behind the marker this request is undoing.
  if (action === "add" && windowHit !== null) {
    return json({ error: "rate_limited" }, 429, {
      "retry-after": String(secondsUntilNextWindow(nowMs)),
    });
  }

  const dayCount = parseDayCount(dayRaw);
  if (dayCount >= DAILY_LIMIT) {
    return json({ error: "rate_limited" }, 429, {
      "retry-after": String(secondsUntilNextUtcDay(nowMs)),
    });
  }

  const counts = parseCounts(countsRaw);
  if (action === "add") counts[emoji] += 1;
  else counts[emoji] = Math.max(0, counts[emoji] - 1);

  // Claim or release the marker before the count write so a retry cannot
  // apply the same add or remove twice. A crash in between drops one update.
  if (action === "add") await deps.kv.put(votedKey, "1");
  else await deps.kv.delete(votedKey);

  await deps.kv.put(countsStorageKey, preserveCounts(countsRaw, counts));
  if (action === "add") {
    await deps.kv.put(currentWindow, "1", { expirationTtl: KV_MIN_TTL_SEC });
  } else {
    await deps.kv.delete(currentWindow);
  }
  await deps.kv.put(today, String(dayCount + 1), {
    expirationTtl: DAY_TTL_SEC,
  });

  return json({ postId, emoji, action, voted: action === "add", counts }, 200);
}

function conflict(
  error: "already_reacted" | "not_reacted",
  postId: string,
  emoji: ReactionEmoji,
  voted: boolean,
  countsRaw: string | null
): Response {
  return json(
    { error, postId, emoji, voted, counts: parseCounts(countsRaw) },
    409
  );
}

/** Keep non-whitelist keys (retired 👎 counts) in KV, but never read them back. */
function preserveCounts(raw: string | null, counts: ReactionCounts): string {
  let preserved: Record<string, unknown> = {};
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        preserved = { ...(parsed as Record<string, unknown>) };
      }
    } catch {
      preserved = {};
    }
  }
  for (const emoji of REACTION_EMOJIS) preserved[emoji] = counts[emoji];
  return JSON.stringify(preserved);
}

function parseDayCount(raw: string | null): number {
  if (!raw) return 0;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return 0;
  return value;
}

function secondsUntilNextUtcDay(nowMs: number): number {
  const date = new Date(nowMs);
  const next = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1
  );
  return Math.max(KV_MIN_TTL_SEC, Math.ceil((next - nowMs) / 1000));
}

function json(
  body: unknown,
  status: number,
  extra?: Record<string, string>
): Response {
  const headers = new Headers(extra);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "private, no-store");
  return new Response(JSON.stringify(body), { status, headers });
}
