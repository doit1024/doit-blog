import { GET, POST, prerender } from "@/pages/api/bb/reactions";
import {
  DAILY_LIMIT,
  canonicalReactionEmoji,
  countsKey,
  dayBucket,
  dayKey,
  emptyCounts,
  hashIp,
  mineKey,
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
const POST_C = "27063591207180ab0000000000000003";
const IP = "203.0.113.10";
const OTHER_IP = "198.51.100.8";
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
    async delete(key) {
      store.delete(key);
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
  init?: {
    ip?: string;
    now?: number;
    pepper?: string;
    kv?: ReactionsKv;
    action?: "add" | "remove";
  }
) {
  const kv = init?.kv ?? memoryKv();
  const body: { postId: string; emoji: string; action?: string } = {
    postId,
    emoji,
  };
  if (init?.action) body.action = init.action;
  return handleReactionsRequest(
    new Request("https://blog.doooit.me/api/bb/reactions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": init?.ip ?? IP,
      },
      body: JSON.stringify(body),
    }),
    {
      kv,
      pepper: init?.pepper ?? PEPPER,
      now: () => init?.now ?? NOW,
      ip: init?.ip ?? IP,
    }
  );
}

function readReactions(
  ids: string,
  kv: ReactionsKv,
  ip = IP
): Promise<Response> {
  return handleReactionsRequest(
    new Request(`https://blog.doooit.me/api/bb/reactions?ids=${ids}`, {
      headers: { "cf-connecting-ip": ip },
    }),
    { kv, pepper: PEPPER, ip }
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
  assertEqual(canonicalReactionEmoji("👎"), null, "thumbs down is retired");
  assert(!("👎" in emptyCounts()), "empty counts omit thumbs down");
  assertEqual(
    mineKey("abc", POST_A, "👍"),
    `bb:mine:abc:${POST_A}:👍`,
    "mine marker key"
  );
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
  assertEqual(createdBody.action, "add", "omitted action defaults to add");
  assertEqual(createdBody.voted, true, "add reports voted");
  assertEqual(
    createdBody.counts,
    withCounts({ "👍": 1 }),
    "increment one emoji"
  );
  assert(!("👎" in createdBody.counts), "response hides retired emoji");
  assertEqual(
    await kv.get(mineKey(hash, POST_A, "👍")),
    "1",
    "add writes the mine marker"
  );

  const otherEmoji = await post(POST_A, "😄", { kv, now: NOW + 1000 });
  assertEqual(otherEmoji.status, 200, "same post, different emoji, same 10s");
  assertEqual(
    (await otherEmoji.json()).counts,
    withCounts({ "👍": 1, "😄": 1 }),
    "the other emoji increments"
  );

  const dayAfterAdds = await kv.get(dayKey(hash, dayBucket(NOW)));
  const duplicate = await post(`27063591-2071-80ab-0000-000000000001`, "👍", {
    kv,
    now: NOW + 1000,
  });
  assertEqual(duplicate.status, 409, "already voted is not a second add");
  const duplicateBody = await duplicate.json();
  assertEqual(duplicateBody.error, "already_reacted", "duplicate add error");
  assertEqual(duplicateBody.voted, true, "duplicate keeps voted");
  assertEqual(
    duplicateBody.counts,
    withCounts({ "👍": 1, "😄": 1 }),
    "duplicate add does not increment"
  );
  assertEqual(
    await kv.get(dayKey(hash, dayBucket(NOW))),
    dayAfterAdds,
    "rejected add does not spend the daily cap"
  );

  const otherPost = await post(POST_B, "👍", { kv, now: NOW + 1000 });
  assertEqual(otherPost.status, 200, "another post is its own window");

  const later = await post(POST_A, "👍", { kv, now: NOW + 10_000 });
  assertEqual(later.status, 409, "a later window still cannot double-add");

  const otherVisitor = await post(POST_A, "👍", {
    kv,
    now: NOW + 10_000,
    ip: OTHER_IP,
  });
  assertEqual(
    otherVisitor.status,
    200,
    "another visitor can add the same emoji"
  );
  assertEqual(
    (await otherVisitor.json()).counts,
    withCounts({ "👍": 2, "😄": 1 }),
    "second visitor increments"
  );

  const removed = await post(POST_A, "👍", {
    kv,
    action: "remove",
    now: NOW + 1500,
  });
  assertEqual(removed.status, 200, "remove inside the 10s window is allowed");
  const removedBody = await removed.json();
  assertEqual(removedBody.action, "remove", "remove action");
  assertEqual(removedBody.voted, false, "remove clears voted");
  assertEqual(
    removedBody.counts,
    withCounts({ "👍": 1, "😄": 1 }),
    "remove decrements one"
  );
  assertEqual(
    await kv.get(mineKey(hash, POST_A, "👍")),
    null,
    "remove deletes the mine marker"
  );
  assertEqual(
    await kv.get(windowKey(hash, POST_A, "👍", windowBucket(NOW + 1500))),
    null,
    "remove clears the short-window marker"
  );

  const again = await post(POST_A, "👍", { kv, now: NOW + 1600 });
  assertEqual(again.status, 200, "re-add after remove is not rate limited");
  assertEqual(
    (await again.json()).counts,
    withCounts({ "👍": 2, "😄": 1 }),
    "re-add increments once"
  );

  const undone = await post(POST_A, "👍", {
    kv,
    action: "remove",
    now: NOW + 1700,
  });
  assertEqual(undone.status, 200, "second remove");
  const missing = await post(POST_A, "👍", {
    kv,
    action: "remove",
    now: NOW + 1800,
  });
  assertEqual(missing.status, 409, "cannot remove a vote that is not there");
  const missingBody = await missing.json();
  assertEqual(missingBody.error, "not_reacted", "missing vote error");
  assertEqual(
    missingBody.counts,
    withCounts({ "👍": 1, "😄": 1 }),
    "rejected remove does not decrement"
  );

  const listed = await handleReactionsRequest(
    new Request(
      `https://blog.doooit.me/api/bb/reactions?ids=${POST_A},zzzz,${POST_B}`
    ),
    { kv, pepper: PEPPER }
  );
  assertEqual(listed.status, 400, "one bad id fails the batch");

  const read = await readReactions(
    `${POST_A.toUpperCase()},${"ab".padEnd(32, "0")}`,
    kv
  );
  assertEqual(read.status, 200, "hydrate");
  const readBody = await read.json();
  assertEqual(
    readBody.reactions[POST_A],
    withCounts({ "👍": 1, "😄": 1 }),
    "stored counts"
  );
  assertEqual(readBody.mine[POST_A], ["😄"], "GET lists this visitor's votes");
  assertEqual(
    readBody.reactions["ab".padEnd(32, "0")],
    emptyCounts(),
    "missing key is zero"
  );
  assertEqual(
    readBody.mine["ab".padEnd(32, "0")],
    [],
    "missing post has no votes"
  );
  const otherRead = await readReactions(POST_A, kv, OTHER_IP);
  assertEqual(
    (await otherRead.json()).mine[POST_A],
    ["👍"],
    "another visitor sees only their own vote"
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
  const retired = await post(POST_A, "👎", { kv, now: NOW + 20_000 });
  assertEqual(retired.status, 400, "thumbs down is not accepted");
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

  await kv.put(
    countsKey(POST_C),
    JSON.stringify({ "👎": 9, "👍": 1, nope: 4 })
  );
  const legacy = await readReactions(POST_C, kv);
  const legacyBody = await legacy.json();
  assertEqual(
    legacyBody.reactions[POST_C],
    withCounts({ "👍": 1 }),
    "stored thumbs-down count is not returned"
  );
  const legacyAdd = await post(POST_C, "😄", { kv, now: NOW + 21_000 });
  assertEqual(legacyAdd.status, 200, "other emoji still increments");
  const legacyStored = JSON.parse((await kv.get(countsKey(POST_C))) ?? "{}");
  assertEqual(legacyStored["👎"], 9, "retired count stays in KV");
  assertEqual(legacyStored["😄"], 1, "new emoji is stored beside it");

  const windowAt = NOW + 22_000;
  await kv.put(windowKey(hash, POST_A, "🎉", windowBucket(windowAt)), "1");
  const windowBlocked = await post(POST_A, "🎉", { kv, now: windowAt });
  assertEqual(windowBlocked.status, 429, "short window still limits a new add");
  assertEqual(
    JSON.parse((await kv.get(countsKey(POST_A))) ?? "{}")["🎉"],
    0,
    "rate limited add does not increment"
  );

  const floorHash = await hashIp(OTHER_IP, PEPPER);
  await kv.put(mineKey(floorHash, POST_C, "👀"), "1");
  const floored = await post(POST_C, "👀", {
    kv,
    action: "remove",
    ip: OTHER_IP,
    now: NOW + 23_000,
  });
  assertEqual(floored.status, 200, "remove with a zero count succeeds");
  assertEqual(
    (await floored.json()).counts["👀"],
    0,
    "count does not go below zero"
  );
  assertEqual(
    await kv.get(mineKey(floorHash, POST_C, "👀")),
    null,
    "zero-count remove still clears the marker"
  );

  const badAction = await handleReactionsRequest(
    new Request("https://blog.doooit.me/api/bb/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postId: POST_A, emoji: "👍", action: "toggle" }),
    }),
    { kv, pepper: PEPPER, now: () => NOW + 24_000, ip: IP }
  );
  assertEqual(badAction.status, 400, "unknown action");

  const method = await handleReactionsRequest(
    new Request("https://blog.doooit.me/api/bb/reactions", { method: "PUT" }),
    { kv, pepper: PEPPER }
  );
  assertEqual(method.status, 405, "only GET and POST");

  const day = dayKey(hash, dayBucket(NOW + 30_000));
  await kv.put(day, String(DAILY_LIMIT));
  const capped = await post(POST_B, "👀", { kv, now: NOW + 30_000 });
  assertEqual(capped.status, 429, "daily cap blocks adds");
  await kv.put(mineKey(hash, POST_B, "🚀"), "1");
  const cappedRemove = await post(POST_B, "🚀", {
    kv,
    action: "remove",
    now: NOW + 30_000,
  });
  assertEqual(cappedRemove.status, 429, "daily cap blocks removes");
  assertEqual(
    await kv.get(mineKey(hash, POST_B, "🚀")),
    "1",
    "capped remove keeps the marker"
  );

  const broken: ReactionsKv = {
    async get() {
      throw new Error("kv down");
    },
    async put() {
      throw new Error("kv down");
    },
    async delete() {
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

  assert(
    kv.keys().every(key => !key.includes(IP) && !key.includes(OTHER_IP)),
    "stored keys keep the hash, not the raw IP"
  );
  assert(
    kv.keys().some(key => key.startsWith(`bb:rl:${hash}:`)),
    "short window markers are keyed by the hash"
  );
  assert(
    kv.keys().some(key => key.startsWith("bb:mine:")),
    "mine markers are stored"
  );
}
