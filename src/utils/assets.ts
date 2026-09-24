export const WEBP_CLOUD_ORIGIN = "https://d28ebb3.webp.li";
export const R2_ORIGIN = "https://asset.doooit.me";

/**
 * Article column is `max-w-3xl` (48rem) with `px-4` → ~45rem CSS.
 * 1280 covers 2× without asking the proxy to transcode camera originals
 * at full resolution (those miss the 200MiB cache and hang).
 */
export const POST_IMAGE_WIDTHS = [640, 960, 1280] as const;
export const POST_IMAGE_SIZES = "(min-width: 48rem) 45rem, calc(100vw - 2rem)";
export const POST_IMAGE_WIDTH = 960;
export const POST_LIGHTBOX_WIDTH = 1280;

const PROXY_QUERY_KEYS = [
  "width",
  "height",
  "max_width",
  "max_height",
  "quality",
] as const;

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function isWebpCloudUrl(url: string): boolean {
  return originOf(url) === WEBP_CLOUD_ORIGIN;
}

export function isR2Url(url: string): boolean {
  return originOf(url) === R2_ORIGIN;
}

export function isOurCdnUrl(url: string): boolean {
  return isWebpCloudUrl(url) || isR2Url(url);
}

export function isGifUrl(url: string): boolean {
  try {
    return /\.gif$/i.test(new URL(url).pathname);
  } catch {
    return /\.gif(\?|$)/i.test(url);
  }
}

function stripProxyParams(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== WEBP_CLOUD_ORIGIN && parsed.origin !== R2_ORIGIN) {
      return url;
    }
    for (const key of PROXY_QUERY_KEYS) parsed.searchParams.delete(key);
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Browser URLs must hit WebP Cloud, never the R2 custom domain.
 * Random third-party hosts are left alone (proxying them as an R2 path 404s).
 */
export function toWebpCloudUrl(url: string): string {
  const stripped = stripProxyParams(url);
  if (isWebpCloudUrl(stripped)) return stripped;
  if (isR2Url(stripped)) {
    return stripped.replace(R2_ORIGIN, WEBP_CLOUD_ORIGIN);
  }
  return stripped;
}

export function getOriginImage(webpImgUrl: string): string {
  const stripped = stripProxyParams(webpImgUrl);
  if (stripped.startsWith(WEBP_CLOUD_ORIGIN)) {
    return stripped.replace(WEBP_CLOUD_ORIGIN, R2_ORIGIN);
  }
  return stripped;
}

export type WebpCloudParams = {
  width?: number;
  maxWidth?: number;
  quality?: number;
};

function roundPositive(value: number): number | null {
  const rounded = Math.round(value);
  return Number.isFinite(rounded) && rounded >= 1 ? rounded : null;
}

/**
 * Append WebP Cloud resize/quality query params.
 * Never sets `width` and `height` together (that attention-crops).
 * Non-proxy URLs are returned untouched.
 */
export function withWebpCloudParams(
  url: string,
  params: WebpCloudParams = {}
): string {
  const proxied = toWebpCloudUrl(url);
  if (!isWebpCloudUrl(proxied)) return proxied;

  let parsed: URL;
  try {
    parsed = new URL(proxied);
  } catch {
    return proxied;
  }

  const maxWidth =
    params.maxWidth != null ? roundPositive(params.maxWidth) : null;
  const width = params.width != null ? roundPositive(params.width) : null;
  if (maxWidth) parsed.searchParams.set("max_width", String(maxWidth));
  if (width) parsed.searchParams.set("width", String(width));
  if (params.quality != null) {
    const level = Math.round(params.quality);
    if (Number.isFinite(level) && level >= 10 && level <= 100) {
      parsed.searchParams.set("quality", String(level));
    }
  }
  return parsed.toString();
}

/**
 * Append WebP Cloud `max_width` (px) and optional `quality` (10–100).
 * The service leaves images that are already within the cap unchanged, and
 * does not upscale them.
 */
export function withWebpCloudMaxWidth(
  url: string,
  maxWidth: number,
  quality?: number
): string {
  return withWebpCloudParams(url, { maxWidth, quality });
}

export function webpCloudSrcSet(
  url: string,
  widths: readonly number[],
  quality?: number
): string | undefined {
  if (!isWebpCloudUrl(toWebpCloudUrl(url))) return undefined;
  if (isGifUrl(url)) return undefined;
  const unique = [
    ...new Set(
      widths
        .map(roundPositive)
        .filter((width): width is number => width != null)
    ),
  ];
  if (unique.length === 0) return undefined;
  return unique
    .map(width => `${withWebpCloudParams(url, { width, quality })} ${width}w`)
    .join(", ");
}

export type CdnImgAttrs = {
  src: string;
  srcset?: string;
  sizes?: string;
  lightboxSrc: string;
};

/** In-article photos: real `width=` variants, lightbox stays on the proxy. */
export function postImageAttrs(src: string): CdnImgAttrs {
  const proxied = toWebpCloudUrl(src);
  const gif = isGifUrl(proxied);
  return {
    src: withWebpCloudParams(proxied, { width: POST_IMAGE_WIDTH }),
    srcset: gif ? undefined : webpCloudSrcSet(proxied, POST_IMAGE_WIDTHS),
    sizes: gif ? undefined : POST_IMAGE_SIZES,
    lightboxSrc: withWebpCloudParams(proxied, {
      width: gif ? POST_IMAGE_WIDTH : POST_LIGHTBOX_WIDTH,
    }),
  };
}

/**
 * Notion's image proxy is `https://www.notion.so/image/{urlencoded inner}`.
 * Unwrap public inner hosts so we don't hotlink notion.so (signed URLs expire,
 * and wrapping a third-party URL through WebP Cloud would 404).
 */
export function unwrapNotionImageUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (!host.endsWith("notion.so") && !host.endsWith("notion.site")) {
      return url;
    }
    const match = parsed.pathname.match(/^\/image\/(.+)$/);
    if (!match) return url;
    const inner = decodeURIComponent(match[1]);
    if (!/^https?:\/\//i.test(inner)) return url;
    const innerHost = new URL(inner).hostname;
    if (
      innerHost.endsWith("notion.so") ||
      innerHost.endsWith("notion.site") ||
      innerHost.endsWith("notionusercontent.com") ||
      innerHost.includes("notion-static") ||
      innerHost.includes("prod-files-secure") ||
      innerHost.includes("amazonaws.com")
    ) {
      return url;
    }
    return inner;
  } catch {
    return url;
  }
}

export function mapBbImageUrl(url: string): string {
  return unwrapNotionImageUrl(url);
}
