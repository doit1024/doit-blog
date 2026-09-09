/* eslint-disable no-console -- build-time fetch logs for Cloudflare Workers Builds */
import { NotionAPI } from "notion-client";

const collectionId = "27063591-2071-804b-a600-000b022cce0b";
const collectionViewId = "27063591-2071-804b-88f6-000c9db68426";

/**
 * In-process cache for `astro dev` (a production `astro build` calls this once).
 * Cloudflare `caches.default` is intentionally unused: `/bb` is SSG now.
 */
const CACHE_TTL_MS = 3 * 60 * 1000;

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

/**
 * Node `ofetch` without a browser UA often gets 403 from www.notion.so.
 * Custom `*.notion.site` bases are still tried as a fallback.
 */
const FETCH_OPTIONS = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
};

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

function allowEmptyBuild() {
  const flag = process.env.BB_ALLOW_EMPTY;
  return flag === "1" || flag === "true";
}

function createClient(apiBaseUrl) {
  const options = { ofetchOptions: FETCH_OPTIONS };
  return apiBaseUrl
    ? new NotionAPI({ ...options, apiBaseUrl })
    : new NotionAPI(options);
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

function isUsableRecordMap(recordMap) {
  if (!recordMap?.block || !Object.keys(recordMap.block).length) return false;
  return Object.values(recordMap.block).some(
    block =>
      block?.value?.type === "page" ||
      block?.value?.type === "collection_view_page"
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

      console.info(
        "getMicroBlogData: fetched",
        pages.length,
        "pages via",
        apiBaseUrl ?? "default"
      );
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

  if (allowEmptyBuild()) {
    console.warn(
      "getMicroBlogData: no usable pages; BB_ALLOW_EMPTY is set, baking an empty /bb"
    );
    return [];
  }

  throw (
    lastError ??
    new Error(
      "getMicroBlogData: no usable Notion pages from any API base. Set BB_ALLOW_EMPTY=1 to bake an empty /bb."
    )
  );
}

/**
 * Fetch the public Notion collection at **build time** (or once per TTL in `astro dev`).
 * No Notion integration token is required for this unofficial public API path.
 */
export async function getMicroBlogData() {
  const now = Date.now();

  if (memoryCache.data && now < memoryCache.expiresAt) {
    return memoryCache.data;
  }

  const data = await fetchFreshMicroBlogData();
  memoryCache = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}
