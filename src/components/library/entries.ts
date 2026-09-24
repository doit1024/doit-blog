import { metaLine, type MediaItem } from "@/utils/media-library/types";

export const LIBRARY_PAGE_SIZE = 30;

export type LibraryEntry = {
  id: string;
  title: string;
  type: string;
  dropped: boolean;
  cover: string | null;
  url: string | null;
  note: string;
  meta: string;
  rating: number | null;
  created: string | null;
};

export function toLibraryEntry(item: MediaItem): LibraryEntry {
  return {
    id: item.id,
    title: item.title,
    type: item.type ?? "",
    dropped: item.dropped,
    cover: item.cover,
    url: item.url,
    note: item.note ?? "",
    meta: metaLine(item.type, item.year),
    rating: item.rating,
    created: item.created,
  };
}

/** Same rules as the poster wall: 弃坑 only in its own tab. */
export function entryMatches(entry: LibraryEntry, filter: string): boolean {
  if (filter === "dropped") return entry.dropped;
  if (entry.dropped) return false;
  return filter === "all" || entry.type === filter;
}

export function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
