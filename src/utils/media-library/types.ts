export const MEDIA_TYPES = [
  "书",
  "电影",
  "剧集",
  "综艺",
  "音乐",
  "游戏",
] as const;

/**
 * Tabs on /library. 「全部」is not a tab. 「综艺」stays in Notion and in the
 * baked catalog, but has no tab, so those cards are not reachable on the page.
 */
export const LIBRARY_BROWSE_TYPES = MEDIA_TYPES.filter(type => type !== "综艺");

export const DEFAULT_LIBRARY_FILTER =
  "书" satisfies (typeof LIBRARY_BROWSE_TYPES)[number];

/** Notion 选项已从「电视剧」改名为「剧集」。旧行和预览 JSON 仍可能写旧名。 */
const MEDIA_TYPE_ALIASES: Record<string, (typeof MEDIA_TYPES)[number]> = {
  电视剧: "剧集",
};

export function canonicalMediaType(
  type: string | null | undefined
): string | null {
  if (type == null) return null;
  const trimmed = type.trim();
  if (!trimmed) return null;
  return MEDIA_TYPE_ALIASES[trimmed] ?? trimmed;
}

export function mediaTypesMatch(
  itemType: string | null | undefined,
  filter: string
): boolean {
  return (canonicalMediaType(itemType) ?? "") === filter;
}

export type MediaItem = {
  id: string;
  title: string;
  type: string | null;
  year: string | null;
  date: string | null;
  status: string | null;
  cover: string | null;
  url: string | null;
  note: string | null;
  /** Notion「评分」. Absent when the property is empty. */
  rating: number | null;
  /** Notion page created_time. */
  created: string | null;
  /** Notion「游戏时长（小时）」. Absent when the property is empty. */
  playHours: number | null;
  /** Notion「专辑艺人」. Shown only for 音乐. */
  artist: string | null;
};

/** Hours for a 游戏 row. Empty, non-finite, and negative values stay hidden. */
export function formatPlayHours(
  hours: number | null | undefined
): string | null {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours < 0) {
    return null;
  }
  const rounded = Math.round(hours * 100) / 100;
  const text = rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${text} 小时`;
}

/** Artist line for a 音乐 row. Empty values and other types stay hidden. */
export function albumArtistLine(
  type: string | null | undefined,
  artist: string | null | undefined
): string | null {
  if (!mediaTypesMatch(type, "音乐")) return null;
  const text = artist?.trim();
  return text || null;
}

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
