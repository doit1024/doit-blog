import { richTextPlain, richTextToMarkdown } from "./rich-text";
import { V1_BLOCK_TYPES, type NotionBlock, type NotionRichText } from "./types";

export type ImageResolver = (args: {
  blockId: string;
  url: string;
  caption: string;
}) => Promise<string | null>;

export type ConvertContext = {
  warn: (message: string) => void;
  resolveImage: ImageResolver;
};

type BlockPayload = {
  rich_text?: NotionRichText[];
  caption?: NotionRichText[];
  language?: string;
  url?: string;
  checked?: boolean;
  cells?: NotionRichText[][];
  has_column_header?: boolean;
  expression?: string;
  color?: string;
  icon?: unknown;
  file?: { url?: string };
  external?: { url?: string };
  type?: string;
};

function payload(block: NotionBlock): BlockPayload {
  const value = block[block.type];
  if (value && typeof value === "object") return value as BlockPayload;
  return {};
}

function isListType(
  type: string
): type is "bulleted_list_item" | "numbered_list_item" {
  return type === "bulleted_list_item" || type === "numbered_list_item";
}

function indent(text: string, depth: number): string {
  if (depth <= 0) return text;
  const pad = "  ".repeat(depth);
  return text
    .split("\n")
    .map(line => (line.length ? pad + line : line))
    .join("\n");
}

function warnUnsupported(ctx: ConvertContext, type: string): void {
  ctx.warn(`unsupported block "${type}" (degrade or skip)`);
}

function imageUrl(data: BlockPayload): string | undefined {
  if (data.type === "external") return data.external?.url;
  if (data.type === "file") return data.file?.url;
  return data.external?.url ?? data.file?.url ?? data.url;
}

function fenceLanguage(language: string | undefined): string {
  if (!language) return "";
  const normalized = language.trim().toLowerCase();
  if (!normalized || normalized === "plain text") return "";
  return normalized.replace(/\s+/g, "");
}

function codeMeta(caption: string): string {
  const file = caption.trim().replace(/\s+/g, "-");
  if (!file) return "";
  return ` file="${file}"`;
}

function cellText(cell: NotionRichText[] | undefined): string {
  return richTextToMarkdown(cell).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

async function convertTable(
  block: NotionBlock,
  ctx: ConvertContext
): Promise<string> {
  const rows = (block.children ?? []).filter(row => row.type === "table_row");
  if (!rows.length) {
    ctx.warn("table without rows, skip");
    return "";
  }

  const matrix = rows.map(row => payload(row).cells ?? []);
  const width = Math.max(...matrix.map(row => row.length), 1);
  const header = payload(block).has_column_header !== false;
  const lines: string[] = [];

  const formatRow = (cells: NotionRichText[][]): string => {
    const padded = Array.from({ length: width }, (_, i) => cellText(cells[i]));
    return `| ${padded.join(" | ")} |`;
  };

  if (header) {
    lines.push(formatRow(matrix[0] ?? []));
    lines.push(`| ${Array.from({ length: width }, () => "---").join(" | ")} |`);
    for (const row of matrix.slice(1)) lines.push(formatRow(row));
  } else {
    lines.push(
      `| ${Array.from({ length: width }, (_, i) => `列${i + 1}`).join(" | ")} |`
    );
    lines.push(`| ${Array.from({ length: width }, () => "---").join(" | ")} |`);
    for (const row of matrix) lines.push(formatRow(row));
  }

  return lines.join("\n");
}

async function convertChildren(
  children: NotionBlock[] | undefined,
  ctx: ConvertContext,
  depth: number
): Promise<string> {
  if (!children?.length) return "";
  return blocksToMarkdown(children, ctx, depth);
}

async function convertListItem(
  block: NotionBlock,
  ctx: ConvertContext,
  depth: number
): Promise<string> {
  if (block.type === "to_do") {
    ctx.warn(`unsupported block "to_do" (degrade or skip)`);
  }

  const marker =
    block.type === "numbered_list_item"
      ? "1."
      : block.type === "to_do"
        ? payload(block).checked
          ? "- [x]"
          : "- [ ]"
        : "-";
  const text = richTextToMarkdown(payload(block).rich_text) || " ";
  const nested = await convertChildren(block.children, ctx, depth + 1);
  const head = indent(`${marker} ${text}`, depth);
  return nested ? `${head}\n${nested}` : head;
}

async function convertQuote(
  block: NotionBlock,
  ctx: ConvertContext
): Promise<string> {
  const text = richTextToMarkdown(payload(block).rich_text);
  const nested = await convertChildren(block.children, ctx, 0);
  const body = [text, nested].filter(Boolean).join("\n\n");
  if (!body) return "";
  return body
    .split("\n")
    .map(line => `> ${line}`)
    .join("\n");
}

async function convertImage(
  block: NotionBlock,
  ctx: ConvertContext
): Promise<string> {
  const data = payload(block);
  const url = imageUrl(data);
  const caption = richTextPlain(data.caption).trim();
  if (!url) {
    ctx.warn(`image ${block.id} has no URL, skip`);
    return "";
  }

  const resolved = await ctx.resolveImage({
    blockId: block.id,
    url,
    caption,
  });
  if (!resolved) return "";

  const alt = caption || "image";
  const title = caption ? ` "${caption.replace(/"/g, '\\"')}"` : "";
  return `![${alt}](${resolved}${title})`;
}

async function convertOne(
  block: NotionBlock,
  ctx: ConvertContext,
  depth: number
): Promise<string> {
  const type = block.type;
  const data = payload(block);
  const text = richTextToMarkdown(data.rich_text);

  if (!V1_BLOCK_TYPES.has(type) && type !== "table_row") {
    warnUnsupported(ctx, type);
  }

  switch (type) {
    case "paragraph":
      return text;
    case "heading_1":
      return text ? `# ${text}` : "";
    case "heading_2":
      return text ? `## ${text}` : "";
    case "heading_3":
      return text ? `### ${text}` : "";
    case "quote":
      return convertQuote(block, ctx);
    case "code": {
      const lang = fenceLanguage(data.language);
      const caption = richTextPlain(data.caption);
      const body = richTextPlain(data.rich_text);
      return `\`\`\`${lang}${codeMeta(caption)}\n${body}\n\`\`\``;
    }
    case "image":
      return convertImage(block, ctx);
    case "table":
      return convertTable(block, ctx);
    case "table_row":
      return "";
    case "divider":
      return "---";
    case "callout":
      return convertQuote(block, ctx);
    case "to_do":
    case "bulleted_list_item":
    case "numbered_list_item":
      return convertListItem(block, ctx, depth);
    case "toggle": {
      const nested = await convertChildren(block.children, ctx, depth);
      return [text, nested].filter(Boolean).join("\n\n");
    }
    case "column_list":
    case "column":
    case "synced_block": {
      return convertChildren(block.children, ctx, depth);
    }
    case "bookmark":
    case "link_preview":
    case "embed": {
      const url = data.url;
      if (!url) return "";
      const label = text || url;
      return `[${label}](${url})`;
    }
    case "equation":
      return data.expression ? `$$\n${data.expression}\n$$` : "";
    case "table_of_contents":
    case "breadcrumb":
    case "child_page":
    case "child_database":
    case "template":
    case "unsupported":
    case "video":
    case "file":
    case "pdf":
    case "audio":
      return "";
    default:
      return text;
  }
}

export async function blocksToMarkdown(
  blocks: NotionBlock[],
  ctx: ConvertContext,
  depth = 0
): Promise<string> {
  const parts: string[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    if (!block) {
      i += 1;
      continue;
    }

    if (isListType(block.type) || block.type === "to_do") {
      const groupType = block.type;
      const items: string[] = [];
      while (i < blocks.length && blocks[i]?.type === groupType) {
        const current = blocks[i];
        if (!current) break;
        items.push(await convertListItem(current, ctx, depth));
        i += 1;
      }
      parts.push(items.join("\n"));
      continue;
    }

    const markdown = await convertOne(block, ctx, depth);
    if (markdown.trim()) parts.push(markdown);
    i += 1;
  }

  return parts
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
