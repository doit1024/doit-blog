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

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function parsedTime(value: string | null | undefined): number | null {
  const text = value?.trim();
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isNaN(time) ? null : time;
}

/** Calendar day of a timestamp in Asia/Shanghai (UTC+8, no DST). */
function shanghaiDay(value: string | null | undefined): number | null {
  const time = parsedTime(value);
  if (time == null) return null;
  return Math.floor((time + SHANGHAI_OFFSET_MS) / DAY_MS);
}

/** Descending. Missing values sort last. */
function compareDesc(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

/**
 * Newest Shanghai calendar day of `created` first. The same day keeps `date`
 * order (missing dates last), then exact `created`, then zh title.
 * A same-day bulk import stays in date order instead of being scrambled by
 * created_time values a few seconds apart.
 */
export function compareMedia(a: MediaItem, b: MediaItem): number {
  const dayOrder = compareDesc(shanghaiDay(a.created), shanghaiDay(b.created));
  if (dayOrder !== 0) return dayOrder;

  const dateOrder = compareDesc(parsedTime(a.date), parsedTime(b.date));
  if (dateOrder !== 0) return dateOrder;

  const createdOrder = compareDesc(
    parsedTime(a.created),
    parsedTime(b.created)
  );
  if (createdOrder !== 0) return createdOrder;

  return a.title.localeCompare(b.title, "zh");
}
