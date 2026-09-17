import { R2_ORIGIN, WEBP_CLOUD_ORIGIN } from "@/utils/assets";
import type { NotionPostsConfig } from "./config";
import { downloadBinary, extensionFrom, r2ObjectKey, uploadToR2 } from "./r2";
import type { ImageResolver } from "./blocks-to-markdown";
import type { NotionFile } from "./types";

function hostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isOurCdn(url: string): boolean {
  const host = hostname(url);
  if (!host) return false;
  return (
    host === new URL(WEBP_CLOUD_ORIGIN).hostname ||
    host === new URL(R2_ORIGIN).hostname
  );
}

export function isNotionHosted(url: string): boolean {
  const host = hostname(url);
  if (!host) return true;
  return (
    host.endsWith("notion.so") ||
    host.endsWith("notion.site") ||
    host.endsWith("notionusercontent.com") ||
    host.includes("notion-static") ||
    host.includes("prod-files-secure")
  );
}

export function toWebpUrl(
  config: NotionPostsConfig,
  publicUrl: string
): string {
  if (publicUrl.startsWith(config.webpOrigin)) return publicUrl;
  if (publicUrl.startsWith(R2_ORIGIN)) {
    return publicUrl.replace(R2_ORIGIN, config.webpOrigin);
  }
  try {
    const path = new URL(publicUrl).pathname;
    return `${config.webpOrigin}${path}`;
  } catch {
    return publicUrl;
  }
}

export function fileDownloadUrl(file: NotionFile | null): string | undefined {
  if (!file) return undefined;
  if (file.type === "external") return file.external?.url;
  if (file.type === "file") return file.file?.url;
  return file.external?.url ?? file.file?.url;
}

export async function syncImageToCdn(
  config: NotionPostsConfig,
  args: { slug: string; fileId: string; url: string }
): Promise<string | null> {
  if (isOurCdn(args.url)) return toWebpUrl(config, args.url);

  if (!config.r2) {
    if (isNotionHosted(args.url)) return null;
    return args.url;
  }

  const { bytes, contentType } = await downloadBinary(args.url);
  if (
    !contentType.startsWith("image/") &&
    contentType !== "application/octet-stream"
  ) {
    return null;
  }

  const ext = extensionFrom(contentType, args.url);
  const key = r2ObjectKey(args.slug, args.fileId, ext);
  await uploadToR2(config.r2, key, bytes, contentType);
  return `${config.webpOrigin}/${key}`;
}

export function createImageResolver(
  config: NotionPostsConfig,
  slug: string,
  onSkip: (reason: string) => void
): ImageResolver {
  return async ({ blockId, url }) => {
    try {
      const resolved = await syncImageToCdn(config, {
        slug,
        fileId: blockId,
        url,
      });
      if (!resolved) {
        onSkip(
          `skip image ${blockId}: missing R2 or not an image (no notion.so hotlink)`
        );
      }
      return resolved;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onSkip(`skip image ${blockId}: ${message}`);
      return null;
    }
  };
}
