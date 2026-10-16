import { GET, POST, prerender } from "@/pages/api/bb/reactions";
import {
  DAILY_LIMIT,
  canonicalReactionEmoji,
  countsKey,
  dayBucket,
  dayKey,
  emptyCounts,
  hashIp,
  normalizePostId,
  votedStorageKey,
  windowKey,
  windowBucket,
  type ReactionCounts,
  type ReactionEmoji,
} from "@/utils/bb-reactions";
import {
  UNSET_PEPPER,
  handleReactionsRequest,
  resolvePepper,
  type ReactionsKv,
} from "@/utils/bb-reactions-handler";

const POST_A = "27063591207180ab0000000000000001";
const POST_B = "27063591207180ab0000000000000002";
const IP = "203.0.113.10";
const PEPPER = "test-pepper";
const NOW = Date.UTC(2026, 9, 15, 3, 0, 0);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${message}\n  actual: ${left}\n  expected: ${right}`);
  }
}

function memoryKv(): ReactionsKv & { keys(): string[] } {
  const store = new Map<string, string>();
  return {
    keys: () => [...store.keys()],
    async get(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    async put(key, value) {
      store.set(key, value);
    },
  };
}

function withCounts(
  partial: Partial<Record<ReactionEmoji, number>>
): ReactionCounts {
  return { ...emptyCounts(), ...partial };
}

function post(
  postId: string,
  emoji: string,
  init?: { ip?: string; now?: number; pepper?: string; kv?: ReactionsKv }
) {
  const kv = init?.kv ?? memoryKv();
  return handleReactionsRequest(
    new Request("https://blog.doooit.me/api/bb/reactions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": IP,
      },
      body: JSON.stringify({ postId, emoji }),
    }),
    {
      kv,
      pepper: init?.pepper ?? PEPPER,
      now: () => init?.now ?? NOW,
      ip: init?.ip ?? IP,
    }
  );
}

export async function run() {
  assertEqual(prerender, false, "API route stays on-demand");
  assertEqual(
    normalizePostId("27063591-2071-80AB-0000-000000000001"),
    POST_A,
    "normalize strips hyphens and lowercases"
  );
  assertEqual(normalizePostId("nope"), null, "reject short ids");
  assertEqual(
    votedStorageKey(POST_A, "👍"),
    `bb:rx:voted:${POST_A}:👍`,
    "localStorage key"
  );
  const heart = canonicalReactionEmoji("\u2764");
  assert(heart, "bare heart maps onto the whitelist");
  assertEqual(canonicalReactionEmoji("👏"), null, "old clap emoji is rejected");
  assertEqual(resolvePepper("  "), UNSET_PEPPER, "blank pepper falls back");
  assertEqual(resolvePepper("real"), "real", "secret pepper wins");

  const hash = await hashIp(IP, PEPPER);
  assertEqual(hash.length, 16, "ip hash length");
  assert(!hash.includes(IP), "hash does not contain the raw IP");
  assert(hash !== (await hashIp(IP, "other")), "pepper changes the hash");

  const kv = memoryKv();
  const created = await post(POST_A, "👍", { kv });
  assertEqual(created.status, 200, "first react");
  assertEqual(
    created.headers.get("cache-control"),
    "private, no-store",
    "no store"
  );
  const createdBody = await created.json();
  assertEqual(createdBody.postId, POST_A, "normalized post id");
  assertEqual(
    createdBody.counts,
    withCounts({ "👍": 1 }),
    "increment one emoji"
  );

  const otherEmoji = await post(POST_A, "😄", { kv, now: NOW + 1000 });
  assertEqual(otherEmoji.status, 200, "same post, different emoji, same 10s");
  assertEqual(
    (await otherEmoji.json()).counts,
    withCounts({ "👍": 1, "😄": 1 }),
    "the other emoji increments"
  );

  const blocked = await post(`27063591-2071-80ab-0000-000000000001`, "👍", {
    kv,
    now: NOW + 1000,
  });
  assertEqual(blocked.status, 429, "same emoji inside 10s is limited");
  assertEqual(
    JSON.parse((await kv.get(countsKey(POST_A))) ?? "{}"),
    withCounts({ "👍": 1, "😄": 1 }),
    "rejected react does not increment"
  );

  const otherPost = await post(POST_B, "👍", { kv, now: NOW + 1000 });
  assertEqual(otherPost.status, 200, "another post is its own window");

  const later = await post(POST_A, "👍", { kv, now: NOW + 10_000 });
  assertEqual(later.status, 200, "next 10s window allows the same emoji again");
  assertEqual(
    (await later.json()).counts,
    withCounts({ "👍": 2, "😄": 1 }),
    "second window"
  );

  const listed = await handleReactionsRequest(
    new Request(
      `https://blog.doooit.me/api/bb/reactions?ids=${POST_A},zzzz,${POST_B}`
    ),
    { kv, pepper: PEPPER }
  );
  assertEqual(listed.status, 400, "one bad id fails the batch");

  const read = await handleReactionsRequest(
    new Request(
      `https://blog.doooit.me/api/bb/reactions?ids=${POST_A.toUpperCase()},${"ab".padEnd(32, "0")}`
    ),
    { kv, pepper: PEPPER }
  );
  assertEqual(read.status, 200, "hydrate");
  const readBody = await read.json();
  assertEqual(
    readBody.reactions[POST_A],
    withCounts({ "👍": 2, "😄": 1 }),
    "stored counts"
  );
  assertEqual(
    readBody.reactions["ab".padEnd(32, "0")],
    emptyCounts(),
    "missing key is zero"
  );

  const tooMany = Array.from({ length: 51 }, (_, index) =>
    index.toString(16).padStart(32, "a")
  ).join(",");
  const oversized = await handleReactionsRequest(
    new Request(`https://blog.doooit.me/api/bb/reactions?ids=${tooMany}`),
    { kv, pepper: PEPPER }
  );
  assertEqual(oversized.status, 400, "more than 50 ids");

  const badEmoji = await post(POST_A, "👏", { kv, now: NOW + 20_000 });
  assertEqual(badEmoji.status, 400, "emoji outside the whitelist");
  const heartReact = await post(POST_A, "\u2764", { kv, now: NOW + 20_000 });
  assertEqual(
    heartReact.status,
    200,
    "heart without variation selector counts"
  );
  assertEqual(
    (await heartReact.json()).counts[heart ?? "❤️"],
    1,
    "canonical heart was incremented"
  );

  const method = await handleReactionsRequest(
    new Request("https://blog.doooit.me/api/bb/reactions", { method: "PUT" }),
    { kv, pepper: PEPPER }
  );
  assertEqual(method.status, 405, "only GET and POST");

  const day = dayKey(hash, dayBucket(NOW + 30_000));
  await kv.put(day, String(DAILY_LIMIT));
  const capped = await post(POST_B, "👀", { kv, now: NOW + 30_000 });
  assertEqual(capped.status, 429, "daily cap");

  const broken: ReactionsKv = {
    async get() {
      throw new Error("kv down");
    },
    async put() {
      throw new Error("kv down");
    },
  };
  const failed = await handleReactionsRequest(
    new Request(`https://blog.doooit.me/api/bb/reactions?ids=${POST_A}`),
    { kv: broken, pepper: PEPPER }
  );
  assertEqual(failed.status, 500, "kv errors become 500");

  const unavailable = await GET({
    request: new Request(
      `https://blog.doooit.me/api/bb/reactions?ids=${POST_A}`
    ),
    locals: {},
  } as never);
  assertEqual(unavailable.status, 500, "missing binding");

  const routed = await POST({
    request: new Request("https://blog.doooit.me/api/bb/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postId: POST_A, emoji: "👍" }),
    }),
    locals: {
      runtime: {
        env: {
          BB_REACTIONS: memoryKv(),
          BB_RX_PEPPER: PEPPER,
        },
      },
    },
  } as never);
  assertEqual(routed.status, 200, "route reads the KV binding");

  const marker = windowKey(hash, POST_A, "👍", windowBucket(NOW));
  assert(
    kv.keys().every(key => !key.includes(IP)),
    "stored keys keep the hash, not the raw IP"
  );
  assert(kv.keys().includes(marker), "window marker was written");
}
