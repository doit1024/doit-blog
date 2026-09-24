import { fileDownloadUrl } from "@/utils/notion-posts/images";
import { richTextPlain } from "@/utils/notion-posts/rich-text";
import type {
  NotionFile,
  NotionPage,
  NotionProperty,
} from "@/utils/notion-posts/types";

import { yearFromDate, type MediaItem } from "./types";

function prop(page: NotionPage, name: string): NotionProperty | undefined {
  return page.properties?.[name];
}

function plain(property: NotionProperty | undefined): string {
  if (!property) return "";
  if (property.title?.length) return richTextPlain(property.title).trim();
  if (property.rich_text?.length) {
    return richTextPlain(property.rich_text).trim();
  }
  return "";
}

function ratingOf(property: NotionProperty | undefined): number | null {
  const value = property?.number;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function createdOf(page: NotionPage): string | null {
  const value = page.created_time?.trim();
  return value || null;
}

function titleOf(page: NotionPage): string {
  const named = plain(prop(page, "标题"));
  if (named) return named;
  for (const value of Object.values(page.properties ?? {})) {
    if (value.type === "title") {
      const text = plain(value);
      if (text) return text;
    }
  }
  return "";
}

export function coverFileOf(page: NotionPage): NotionFile | null {
  if (page.cover && fileDownloadUrl(page.cover)) return page.cover;
  for (const value of Object.values(page.properties ?? {})) {
    const file = value.files?.find(candidate => fileDownloadUrl(candidate));
    if (file) return file;
  }
  return null;
}

export function pageToMediaItem(
  page: NotionPage,
  cover: string | null
): MediaItem | null {
  if (page.archived || page.in_trash) return null;
  const title = titleOf(page);
  if (!title) return null;

  const type = prop(page, "类型")?.select?.name?.trim() || null;
  const status = prop(page, "状态")?.select?.name?.trim() || null;
  const date = prop(page, "日期")?.date?.start ?? null;
  const url = prop(page, "链接")?.url?.trim() || null;
  const note = plain(prop(page, "短评")) || null;
  const rating = ratingOf(prop(page, "评分"));
  const created = createdOf(page);

  return {
    id: page.id,
    title,
    type,
    year: yearFromDate(date),
    date,
    status,
    cover,
    url,
    note,
    rating,
    created,
  };
}
