export type BuildLogger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export type NotionRichText = {
  type?: string;
  plain_text?: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
  text?: {
    content?: string;
    link?: { url?: string } | null;
  };
  equation?: { expression?: string };
};

export type NotionFile = {
  type?: string;
  name?: string;
  file?: { url?: string; expiry_time?: string };
  external?: { url?: string };
};

export type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  children?: NotionBlock[];
  [key: string]: unknown;
};

export type NotionProperty = {
  type?: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  select?: { name?: string } | null;
  multi_select?: { name?: string }[];
  date?: { start?: string | null; end?: string | null } | null;
  checkbox?: boolean;
  files?: NotionFile[];
};

export type NotionPage = {
  id: string;
  created_time?: string;
  last_edited_time?: string;
  properties?: Record<string, NotionProperty>;
};

export type PublishedPost = {
  pageId: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  pubDatetime: Date;
  modDatetime: Date | null;
  featured: boolean;
  ogImage: NotionFile | null;
  blocks: NotionBlock[];
};

export const V1_BLOCK_TYPES = new Set([
  "paragraph",
  "heading_1",
  "heading_2",
  "heading_3",
  "bulleted_list_item",
  "numbered_list_item",
  "quote",
  "code",
  "image",
  "table",
  "table_row",
]);
