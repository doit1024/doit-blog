export const MEDIA_TYPES = [
  "书",
  "电影",
  "电视剧",
  "综艺",
  "音乐",
  "游戏",
] as const;

export const DROPPED_STATUS = "弃坑";

export type MediaItem = {
  id: string;
  title: string;
  type: string | null;
  year: string | null;
  date: string | null;
  status: string | null;
  dropped: boolean;
  cover: string | null;
  url: string | null;
  note: string | null;
};

export function yearFromDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})/.exec(value);
  return match?.[1] ?? null;
}

export function metaLine(type: string | null, year: string | null): string {
  return [type, year].filter(Boolean).join(" · ");
}

export function compareMedia(a: MediaItem, b: MediaItem): number {
  const dateOrder = (b.date ?? "").localeCompare(a.date ?? "");
  if (dateOrder !== 0) return dateOrder;
  return a.title.localeCompare(b.title, "zh");
}
