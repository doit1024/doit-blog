import { AwsClient } from "aws4fetch";
import sharp from "sharp";
import { parseImageSize } from "@/utils/image-size-parse";
import type { R2Config } from "./config";

/** Origin we PUT to R2, checked after optimize. WebP Cloud Rapid hangs on huge origins. */
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
/** Abort buffering a pathological download before sharp. Camera JPEGs sit well below this. */
const MAX_DOWNLOAD_BYTES = 80 * 1024 * 1024;
/** Longest edge written to R2. WebP Cloud still fetches the whole origin on miss. */
const MAX_ORIGIN_EDGE = 1600;
const SKIP_OPTIMIZE_BYTES = 400_000;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

function extensionFrom(contentType: string, sourceUrl: string): string {
  const fromType = EXT_BY_TYPE[contentType.split(";")[0]?.trim() ?? ""];
  if (fromType) return fromType;
  try {
    const pathname = new URL(sourceUrl).pathname;
    const match = pathname.match(/\.(jpe?g|png|gif|webp|svg|avif)$/i);
    if (match) return match[0].toLowerCase().replace("jpeg", "jpg");
  } catch {
    // ignore malformed URLs; fall through to default
  }
  return ".jpg";
}

export async function downloadBinary(
  url: string
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`download failed ${res.status} for ${url}`);
  }
  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_DOWNLOAD_BYTES) {
    throw new Error(`image download too large (${declared} bytes)`);
  }
  const buffer = new Uint8Array(await res.arrayBuffer());
  if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
    throw new Error(`image download too large (${buffer.byteLength} bytes)`);
  }
  return { bytes: buffer, contentType };
}

const OPTIMIZE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export type OptimizedImage = {
  bytes: Uint8Array;
  contentType: string;
  width?: number;
  height?: number;
};

/**
 * Shrink camera-sized uploads before they hit R2. WebP Cloud's Rapid mode
 * downloads the origin in full on a cache miss; a 12MB JPEG hangs there.
 * The 20MB cap applies to this result, not the Notion original.
 */

function withParsedSize(result: {
  bytes: Uint8Array;
  contentType: string;
}): OptimizedImage {
  const checked = assertFitsR2(result);
  const size = parseImageSize(checked.bytes);
  if (!size) return checked;
  return { ...checked, width: size.width, height: size.height };
}

export async function optimizeForR2(
  bytes: Uint8Array,
  contentType: string
): Promise<OptimizedImage> {
  const type = contentType.split(";")[0]?.trim() ?? "";
  if (!OPTIMIZE_TYPES.has(type)) return withParsedSize({ bytes, contentType });

  try {
    const image = sharp(bytes, { failOn: "none" });
    const meta = await image.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const alreadySmall =
      width > 0 &&
      height > 0 &&
      width <= MAX_ORIGIN_EDGE &&
      height <= MAX_ORIGIN_EDGE &&
      bytes.byteLength <= SKIP_OPTIMIZE_BYTES;
    if (alreadySmall) return withParsedSize({ bytes, contentType });

    let pipeline = image.rotate();
    if (width > MAX_ORIGIN_EDGE || height > MAX_ORIGIN_EDGE) {
      pipeline = pipeline.resize({
        width: MAX_ORIGIN_EDGE,
        height: MAX_ORIGIN_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    if (type === "image/png" && meta.hasAlpha) {
      const out = await pipeline.png({ compressionLevel: 8 }).toBuffer();
      return withParsedSize({
        bytes: new Uint8Array(out),
        contentType: "image/png",
      });
    }

    const out = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return withParsedSize({
      bytes: new Uint8Array(out),
      contentType: "image/jpeg",
    });
  } catch {
    return withParsedSize({ bytes, contentType });
  }
}

function assertFitsR2(result: { bytes: Uint8Array; contentType: string }): {
  bytes: Uint8Array;
  contentType: string;
} {
  if (result.bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(
      `image too large after optimize (${result.bytes.byteLength} bytes)`
    );
  }
  return result;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

export async function uploadToR2(
  config: R2Config,
  key: string,
  bytes: Uint8Array,
  contentType: string
): Promise<void> {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: "auto",
    service: "s3",
  });

  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;
  const res = await client.fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: toArrayBuffer(bytes),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`R2 PUT ${res.status} ${key} ${detail}`.trim());
  }
}

export function r2ObjectKey(slug: string, fileId: string, ext: string): string {
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "");
  const safeId = fileId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `posts/${safeSlug}/${safeId}${ext}`;
}

export function libraryObjectKey(pageId: string, ext: string): string {
  const safeId = pageId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `library/${safeId}${ext}`;
}

export { extensionFrom };
