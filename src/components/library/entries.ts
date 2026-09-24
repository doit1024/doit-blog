import {
  canonicalMediaType,
  mediaTypesMatch,
  metaLine,
  type MediaItem,
} from "@/utils/media-library/types";

export const LIBRARY_PAGE_SIZE = 30;

export type LibraryEntry = {
  id: string;
  title: string;
  type: string;
  cover: string | null;
  url: string | null;
  note: string;
  meta: string;
  rating: number | null;
  created: string | null;
  playHours: number | null;
};

export function toLibraryEntry(item: MediaItem): LibraryEntry {
  const type = canonicalMediaType(item.type);
  return {
    id: item.id,
    title: item.title,
    type: type ?? "",
    cover: item.cover,
    url: item.url,
    note: item.note ?? "",
    meta: metaLine(type, item.year),
    rating: item.rating,
    created: item.created,
    playHours: item.playHours,
  };
}

export function entryMatches(entry: LibraryEntry, filter: string): boolean {
  return filter === "all" || mediaTypesMatch(entry.type, filter);
}

export function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
