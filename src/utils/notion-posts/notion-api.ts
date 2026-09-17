import type { NotionBlock, NotionPage } from "./types";

const NOTION_VERSION = "2022-06-28";
const NOTION_API = "https://api.notion.com/v1";

type ListResponse<T> = {
  object?: string;
  results?: T[];
  has_more?: boolean;
  next_cursor?: string | null;
  message?: string;
  code?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function notionFetch<T>(
  token: string,
  path: string,
  init: {
    method?: string;
    body?: unknown;
    search?: Record<string, string>;
  } = {}
): Promise<T> {
  const url = new URL(`${NOTION_API}${path}`);
  for (const [key, value] of Object.entries(init.search ?? {})) {
    url.searchParams.set(key, value);
  }

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const res = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get("Retry-After"));
      const waitMs = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : 400 * 2 ** attempt;
      lastError = new Error(`Notion ${res.status} on ${path}`);
      await sleep(waitMs);
      continue;
    }

    const json = (await res.json()) as T & { message?: string; code?: string };
    if (!res.ok) {
      throw new Error(
        `Notion ${res.status} ${json.code ?? ""} ${json.message ?? path}`.trim()
      );
    }
    return json;
  }

  throw lastError ?? new Error(`Notion request failed: ${path}`);
}

export async function queryPublishedPages(
  token: string,
  databaseId: string
): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = {
      page_size: 100,
      filter: {
        property: "Status",
        select: { equals: "Published" },
      },
    };
    if (cursor) body.start_cursor = cursor;

    const json = await notionFetch<ListResponse<NotionPage>>(
      token,
      `/databases/${databaseId}/query`,
      { method: "POST", body }
    );
    pages.push(...(json.results ?? []));
    cursor = json.has_more ? (json.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return pages;
}

async function listChildren(
  token: string,
  blockId: string
): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const search: Record<string, string> = { page_size: "100" };
    if (cursor) search.start_cursor = cursor;

    const json = await notionFetch<ListResponse<NotionBlock>>(
      token,
      `/blocks/${blockId}/children`,
      { search }
    );
    blocks.push(...(json.results ?? []));
    cursor = json.has_more ? (json.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return blocks;
}

export async function fetchBlockTree(
  token: string,
  blockId: string
): Promise<NotionBlock[]> {
  const blocks = await listChildren(token, blockId);

  for (const block of blocks) {
    if (
      !block.has_children ||
      block.type === "child_page" ||
      block.type === "child_database"
    ) {
      continue;
    }
    block.children = await fetchBlockTree(token, block.id);
  }

  return blocks;
}
