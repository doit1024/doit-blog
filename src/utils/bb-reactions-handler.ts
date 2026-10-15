import {
  DAILY_LIMIT,
  KV_MIN_TTL_SEC,
  MAX_REACTION_IDS,
  countsKey,
  dayBucket,
  dayKey,
  hashIp,
  isReactionEmoji,
  normalizePostId,
  parseCounts,
  secondsUntilNextWindow,
  windowBucket,
  windowKey,
  type ReactionCounts,
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

  try {
    if (method === "GET") return await handleGet(request, options.kv);
    return await handlePost(request, {
      kv: options.kv,
      pepper: options.pepper,
      now: options.now ?? (() => Date.now()),
      ip: options.ip ?? clientIp(request),
    });
  } catch {
    return json({ error: "reactions_unavailable" }, 500);
  }
}

async function handleGet(request: Request, kv: ReactionsKv): Promise<Response> {
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

  const reactions: Record<string, ReactionCounts> = {};
  await Promise.all(
    ids.map(async id => {
      reactions[id] = parseCounts(
        await kv.get(countsKey(id), { cacheTtl: READ_CACHE_TTL })
      );
    })
  );

  return json({ reactions }, 200);
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
  if (!postId || !isReactionEmoji(record.emoji)) {
    return json({ error: "bad_request" }, 400);
  }

  const nowMs = deps.now();
  const ipHash = await hashIp(deps.ip, deps.pepper);
  const currentWindow = windowKey(ipHash, postId, windowBucket(nowMs));
  const today = dayKey(ipHash, dayBucket(nowMs));
  const [windowHit, dayRaw] = await Promise.all([
    deps.kv.get(currentWindow, { cacheTtl: READ_CACHE_TTL }),
    deps.kv.get(today, { cacheTtl: READ_CACHE_TTL }),
  ]);

  if (windowHit !== null) {
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

  const counts = parseCounts(
    await deps.kv.get(countsKey(postId), { cacheTtl: READ_CACHE_TTL })
  );
  counts[record.emoji] += 1;

  await deps.kv.put(countsKey(postId), JSON.stringify(counts));
  await deps.kv.put(currentWindow, "1", { expirationTtl: KV_MIN_TTL_SEC });
  await deps.kv.put(today, String(dayCount + 1), {
    expirationTtl: DAY_TTL_SEC,
  });

  return json({ postId, counts }, 200);
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
