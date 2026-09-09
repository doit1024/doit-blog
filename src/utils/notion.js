import { NotionAPI } from "notion-client";

const collectionId = "27063591-2071-804b-a600-000b022cce0b";
const collectionViewId = "27063591-2071-804b-88f6-000c9db68426";

/** Cache Notion payloads briefly to avoid hammering public APIs on every /bb hit. */
const CACHE_TTL_MS = 3 * 60 * 1000;
/** Bump cache key when recordMap shape/normalization changes. */
const CACHE_REQUEST = new Request(
  "https://blog.doooit.me/__cache/microblog-v2"
);

/**
 * Notion public endpoints sometimes reject custom `*.notion.site` bases
 * (queryCollection → 403) while `www.notion.so` still works, and vice versa
 * for intermittent 503s. Try a few bases and keep the first that returns rows.
 */
const API_BASES = [
  undefined, // notion-client default (www.notion.so)
  "https://www.notion.so/api/v3",
  "https://doooit.notion.site/api/v3",
];

const RECORD_MAP_TABLES = [
  "block",
  "collection",
  "collection_view",
  "notion_user",
  "space",
];

let memoryCache = {
  expiresAt: 0,
  data: null,
};

function createClient(apiBaseUrl) {
  return apiBaseUrl ? new NotionAPI({ apiBaseUrl }) : new NotionAPI();
}

/**
 * Notion's public API now nests records as `{ spaceId, value: { value, role } }`.
 * react-notion-x / our MicroBlog expect the older `{ role, value: Block }` shape.
 */
function normalizeRecordMapEntry(entry) {
  if (!entry || typeof entry !== "object") return entry;
  const nested = entry.value;
  if (
    nested &&
    typeof nested === "object" &&
    nested.value &&
    typeof nested.value === "object" &&
    nested.value.type &&
    !nested.type
  ) {
    return {
      role: nested.role ?? entry.role,
      value: nested.value,
      ...(entry.spaceId ? { spaceId: entry.spaceId } : {}),
    };
  }
  return entry;
}

function normalizeRecordMap(recordMap) {
  if (!recordMap || typeof recordMap !== "object") return recordMap;

  const out = { ...recordMap };
  for (const table of RECORD_MAP_TABLES) {
    const tableMap = recordMap[table];
    if (!tableMap || typeof tableMap !== "object") continue;
    const next = {};
    for (const [id, entry] of Object.entries(tableMap)) {
      next[id] = normalizeRecordMapEntry(entry);
    }
    out[table] = next;
  }
  return out;
}

async function readSharedCache() {
  try {
    if (typeof caches === "undefined" || !caches.default) return null;
    const hit = await caches.default.match(CACHE_REQUEST);
    if (!hit) return null;
    return await hit.json();
  } catch (err) {
    console.warn("getMicroBlogData: shared cache read failed", err);
    return null;
  }
}

async function writeSharedCache(data) {
  if (!data?.length) return;
  try {
    if (typeof caches === "undefined" || !caches.default) return;
    const response = new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${Math.floor(CACHE_TTL_MS / 1000)}`,
      },
    });
    await caches.default.put(CACHE_REQUEST, response);
  } catch (err) {
    console.warn("getMicroBlogData: shared cache write failed", err);
  }
}

function isUsableRecordMap(recordMap) {
  if (!recordMap?.block || !Object.keys(recordMap.block).length) return false;
  return Object.values(recordMap.block).some(
    block => block?.value?.type === "page" || block?.value?.type === "collection_view_page"
  );
}

async function fetchFreshMicroBlogData() {
  let lastError;

  for (const apiBaseUrl of API_BASES) {
    try {
      const notionClient = createClient(apiBaseUrl);
      const collectionData = await notionClient.getCollectionData(
        collectionId,
        collectionViewId
      );
      const allBlockIds = collectionData?.allBlockIds ?? [];

      if (!allBlockIds.length) {
        console.warn(
          "getMicroBlogData: empty allBlockIds via",
          apiBaseUrl ?? "default"
        );
        continue;
      }

      const settled = await Promise.allSettled(
        allBlockIds.reverse().map(id => notionClient.getPage(id))
      );

      const pages = settled
        .filter(result => result.status === "fulfilled")
        .map(result => normalizeRecordMap(result.value))
        .filter(isUsableRecordMap);

      settled.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            "getMicroBlogData: getPage failed",
            allBlockIds[allBlockIds.length - 1 - index],
            result.reason
          );
        }
      });

      if (!pages.length) {
        console.warn(
          "getMicroBlogData: no usable pages via",
          apiBaseUrl ?? "default"
        );
        continue;
      }

      return pages;
    } catch (err) {
      lastError = err;
      console.error(
        "getMicroBlogData failed via",
        apiBaseUrl ?? "default",
        err
      );
    }
  }

  console.error("getMicroBlogData exhausted API bases", lastError);
  return [];
}

export async function getMicroBlogData() {
  const now = Date.now();

  if (memoryCache.data && now < memoryCache.expiresAt) {
    return memoryCache.data;
  }

  const shared = await readSharedCache();
  if (shared?.length) {
    memoryCache = { data: shared, expiresAt: now + CACHE_TTL_MS };
    return shared;
  }

  const data = await fetchFreshMicroBlogData();
  memoryCache = { data, expiresAt: now + CACHE_TTL_MS };
  await writeSharedCache(data);
  return data;
}
