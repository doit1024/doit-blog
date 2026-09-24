import { readFileSync } from "node:fs";

import {
  readNotionPostsConfig,
  type NotionPostsConfig,
} from "@/utils/notion-posts/config";
import {
  fileDownloadUrl,
  isNotionHosted,
  isOurCdn,
  toWebpUrl,
} from "@/utils/notion-posts/images";
import { queryMediaPages } from "@/utils/notion-posts/notion-api";
import {
  downloadBinary,
  extensionFrom,
  libraryObjectKey,
  uploadToR2,
} from "@/utils/notion-posts/r2";
import type { NotionFile } from "@/utils/notion-posts/types";

import { coverFileOf, pageToMediaItem } from "./map";
import { compareMedia, type MediaItem } from "./types";

export type MediaLogger = {
  info: (message: string) => void;
  warn: (message: string) => void;
};

const COVER_CONCURRENCY = 6;

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Math.min(Math.max(limit, 1), items.length || 1);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

async function resolveCover(
  config: NotionPostsConfig,
  pageId: string,
  file: NotionFile | null,
  stats: { skipped: number; kept: number; uploaded: number }
): Promise<string | null> {
  const url = fileDownloadUrl(file);
  if (!url) return null;

  try {
    if (isOurCdn(url)) return toWebpUrl(config, url);

    if (!config.r2) {
      if (isNotionHosted(url)) {
        stats.skipped += 1;
        return null;
      }
      stats.kept += 1;
      return url;
    }

    const { bytes, contentType } = await downloadBinary(url);
    if (
      !contentType.startsWith("image/") &&
      contentType !== "application/octet-stream"
    ) {
      stats.skipped += 1;
      return null;
    }

    const ext = extensionFrom(contentType, url);
    const key = libraryObjectKey(pageId, ext);
    await uploadToR2(config.r2, key, bytes, contentType);
    stats.uploaded += 1;
    return `${config.webpOrigin}/${key}`;
  } catch {
    stats.skipped += 1;
    return null;
  }
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function optionalRating(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isMediaItem(value: unknown): value is MediaItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MediaItem>;
  return typeof item.id === "string" && typeof item.title === "string";
}

function loadPreview(
  filePath: string,
  logger: MediaLogger
): MediaItem[] | null {
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    if (!Array.isArray(raw)) throw new Error("expected an array");
    const items = raw.filter(isMediaItem).map(item => ({
      id: item.id,
      title: item.title,
      type: item.type ?? null,
      year: item.year ?? null,
      date: item.date ?? null,
      status: item.status ?? null,
      cover: item.cover ?? null,
      url: item.url ?? null,
      note: item.note ?? null,
      rating: optionalRating(item.rating),
      created: optionalString(item.created),
    }));
    items.sort(compareMedia);
    logger.info(
      `library: preview JSON ${items.length} item(s) from ${filePath}`
    );
    return items;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`library: preview JSON skipped: ${message}`);
    return null;
  }
}

export async function loadMediaLibrary(
  logger: MediaLogger
): Promise<MediaItem[]> {
  const config = readNotionPostsConfig();
  const previewPath = process.env.LIBRARY_PREVIEW_JSON?.trim();
  const token = config.token;
  const mediaDatabaseId = config.mediaDatabaseId;

  if (!token || !mediaDatabaseId) {
    if (previewPath) {
      return loadPreview(previewPath, logger) ?? [];
    }
    logger.info(
      "library: no NOTION_TOKEN or NOTION_MEDIA_DATABASE_ID; skip media source"
    );
    return [];
  }

  if (!config.r2) {
    logger.warn(
      "library: R2 env incomplete; Notion-hosted covers become text cards, external cover URLs are kept"
    );
  }

  let pages;
  try {
    pages = await queryMediaPages(token, mediaDatabaseId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`library: fetch failed, skip media source: ${message}`);
    return [];
  }

  const stats = { skipped: 0, kept: 0, uploaded: 0 };
  const items = (
    await mapPool(pages, COVER_CONCURRENCY, async page => {
      const cover = await resolveCover(
        config,
        page.id,
        coverFileOf(page),
        stats
      );
      return pageToMediaItem(page, cover);
    })
  ).filter((item): item is MediaItem => item !== null);

  items.sort(compareMedia);
  logger.info(
    `library: ${items.length} item(s), covers uploaded ${stats.uploaded}, external ${stats.kept}, skipped ${stats.skipped}`
  );
  if (stats.skipped) {
    logger.warn(
      `library: ${stats.skipped} cover(s) skipped (no R2, not an image, or transfer failed)`
    );
  }
  return items;
}
