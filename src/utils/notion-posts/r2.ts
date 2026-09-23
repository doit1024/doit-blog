import { AwsClient } from "aws4fetch";
import type { R2Config } from "./config";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

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
  const buffer = new Uint8Array(await res.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error(`image too large (${buffer.byteLength} bytes)`);
  }
  return { bytes: buffer, contentType };
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
