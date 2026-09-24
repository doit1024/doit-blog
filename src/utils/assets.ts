export const WEBP_CLOUD_ORIGIN = "https://d28ebb3.webp.li";
export const R2_ORIGIN = "https://asset.doooit.me";

export const getOriginImage = (webpImgUrl: string) => {
  if (webpImgUrl.startsWith(WEBP_CLOUD_ORIGIN)) {
    return webpImgUrl.replace(WEBP_CLOUD_ORIGIN, R2_ORIGIN);
  }
  return webpImgUrl;
};

/**
 * Append WebP Cloud `max_width` (px). The service leaves images that are
 * already within the cap unchanged, and does not upscale them.
 * `width` + `height` together would attention-crop; this helper never sets
 * that pair. Non-proxy URLs are returned untouched.
 */
export function withWebpCloudMaxWidth(url: string, maxWidth: number): string {
  const width = Math.round(maxWidth);
  if (!Number.isFinite(width) || width < 1) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (parsed.origin !== WEBP_CLOUD_ORIGIN) return url;

  parsed.searchParams.set("max_width", String(width));
  return parsed.toString();
}
