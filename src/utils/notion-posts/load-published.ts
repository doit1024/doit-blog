import { SITE } from "@/config";
import { ENGLISH_KEBAB_SLUG, type NotionPostsConfig } from "./config";
import { fetchBlockTree, queryPublishedPages } from "./notion-api";
import { richTextPlain } from "./rich-text";
import type { NotionPage, NotionProperty, PublishedPost } from "./types";

function prop(page: NotionPage, name: string): NotionProperty | undefined {
  return page.properties?.[name];
}

function titleOf(page: NotionPage): string {
  const title = prop(page, "Title");
  if (title?.title) return richTextPlain(title.title).trim();
  for (const value of Object.values(page.properties ?? {})) {
    if (value.type === "title") return richTextPlain(value.title).trim();
  }
  return "";
}

function parseDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function statusOf(page: NotionPage): PublishedPost["status"] {
  return prop(page, "Status")?.select?.name === "Preview"
    ? "Preview"
    : "Published";
}

export async function loadPublishedPosts(
  config: NotionPostsConfig,
  includePreview = false
): Promise<PublishedPost[]> {
  if (!config.token || !config.databaseId) return [];

  const pages = await queryPublishedPages(
    config.token,
    config.databaseId,
    includePreview
  );
  const posts: PublishedPost[] = [];

  for (const page of pages) {
    const slug = richTextPlain(prop(page, "Slug")?.rich_text).trim();
    const title = titleOf(page);
    const description = richTextPlain(
      prop(page, "Description")?.rich_text
    ).trim();
    const created = parseDate(page.created_time, new Date());
    const pubDatetime = parseDate(
      prop(page, "pubDatetime")?.date?.start,
      created
    );
    const modRaw = prop(page, "modDatetime")?.date?.start;
    const modDatetime = modRaw
      ? parseDate(modRaw, parseDate(page.last_edited_time, pubDatetime))
      : parseDate(page.last_edited_time, pubDatetime);
    const tags = (prop(page, "Tags")?.multi_select ?? [])
      .map(tag => tag.name?.trim())
      .filter((tag): tag is string => Boolean(tag));
    const ogFiles = prop(page, "ogImage")?.files ?? [];

    posts.push({
      pageId: page.id,
      slug,
      title,
      description,
      tags: tags.length ? tags : ["others"],
      pubDatetime,
      modDatetime,
      featured: Boolean(prop(page, "featured")?.checkbox),
      ogImage: ogFiles[0] ?? null,
      blocks: await fetchBlockTree(config.token, page.id),
      status: statusOf(page),
    });
  }

  return posts;
}

export function isUsableSlug(slug: string): boolean {
  return ENGLISH_KEBAB_SLUG.test(slug);
}

export function notionPostData(post: PublishedPost) {
  return {
    author: SITE.author,
    pubDatetime: post.pubDatetime,
    modDatetime: post.modDatetime,
    title: post.title,
    featured: post.featured,
    draft: false,
    tags: post.tags,
    description: post.description,
    hideEditPost: true,
    timezone: SITE.timezone,
    ...(post.status === "Preview" ? { preview: true } : {}),
  };
}
