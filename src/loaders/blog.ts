import { glob, type Loader, type LoaderContext } from "astro/loaders";
import { blocksToMarkdown } from "@/utils/notion-posts/blocks-to-markdown";
import {
  hasNotionSource,
  readNotionPostsConfig,
  type NotionPostsConfig,
} from "@/utils/notion-posts/config";
import {
  createImageResolver,
  fileDownloadUrl,
  syncImageToCdn,
} from "@/utils/notion-posts/images";
import {
  isUsableSlug,
  loadPublishedPosts,
  notionPostData,
} from "@/utils/notion-posts/load-published";
import type { PublishedPost } from "@/utils/notion-posts/types";

function withToc(markdown: string): string {
  if (/^##\s+Table of contents\s*$/m.test(markdown)) return markdown;
  if (!markdown.trim()) return "## Table of contents\n";
  return `## Table of contents\n\n${markdown}`;
}

async function ingestNotionPost(
  post: PublishedPost,
  context: LoaderContext,
  config: NotionPostsConfig,
  claimed: Set<string>
): Promise<void> {
  const { store, logger, parseData, renderMarkdown, generateDigest } = context;
  const label = post.slug || post.pageId;

  if (!post.slug || !isUsableSlug(post.slug)) {
    logger.warn(`notion-posts: skip ${label}: Slug must be English kebab-case`);
    return;
  }
  if (!post.title.trim()) {
    logger.warn(`notion-posts: skip ${post.slug}: missing Title`);
    return;
  }
  if (!post.description.trim()) {
    logger.warn(`notion-posts: skip ${post.slug}: missing Description`);
    return;
  }
  if (store.has(post.slug) || claimed.has(post.slug)) {
    logger.warn(
      `notion-posts: skip ${post.slug}: git (or earlier Notion row) wins`
    );
    return;
  }

  const warnings = new Set<string>();
  const markdown = await blocksToMarkdown(post.blocks, {
    warn: message => warnings.add(message),
    resolveImage: createImageResolver(config, post.slug, message =>
      warnings.add(message)
    ),
  });

  for (const warning of warnings) {
    logger.warn(`notion-posts: ${post.slug}: ${warning}`);
  }

  const data: Record<string, unknown> = notionPostData(post);
  const ogUrl = fileDownloadUrl(post.ogImage);
  if (ogUrl) {
    const ogImage = await syncImageToCdn(config, {
      slug: post.slug,
      fileId: "og",
      url: ogUrl,
    });
    if (ogImage) data.ogImage = ogImage;
    else {
      logger.warn(
        `notion-posts: ${post.slug}: skip ogImage (no R2 or upload failed)`
      );
    }
  }

  const body = withToc(markdown);
  const parsed = await parseData({ id: post.slug, data });
  store.set({
    id: post.slug,
    data: parsed,
    body,
    rendered: await renderMarkdown(body),
    digest: generateDigest(`${body}:${JSON.stringify(parsed)}`),
  });
  claimed.add(post.slug);
  logger.info(`notion-posts: loaded /posts/${post.slug}`);
}

async function mergeNotionPosts(context: LoaderContext): Promise<void> {
  const { logger } = context;
  const config = readNotionPostsConfig();

  if (!hasNotionSource(config)) {
    logger.info(
      "notion-posts: no NOTION_TOKEN or NOTION_DATABASE_ID; skip Notion source"
    );
    return;
  }

  if (!config.r2) {
    logger.warn(
      "notion-posts: R2 env incomplete; Notion-hosted images will be skipped"
    );
  }

  let posts: PublishedPost[];
  try {
    posts = await loadPublishedPosts(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`notion-posts: fetch failed, skip Notion source: ${message}`);
    return;
  }

  logger.info(`notion-posts: ${posts.length} Published page(s)`);
  const claimed = new Set<string>();

  for (const post of posts) {
    try {
      await ingestNotionPost(post, context, config, claimed);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`notion-posts: skip ${post.slug || post.pageId}: ${message}`);
    }
  }
}

export function blogLoader(options: { globBase: string }): Loader {
  const disk = glob({
    pattern: "**/[^_]*.{md,mdx}",
    base: options.globBase,
  });

  return {
    name: "blog-dual-source",
    load: async context => {
      await disk.load(context);
      await mergeNotionPosts(context);
    },
  };
}
