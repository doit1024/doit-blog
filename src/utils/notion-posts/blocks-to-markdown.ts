import { postImageAttrs } from "@/utils/assets";
import { resolveImageSize } from "@/utils/image-size";
import { richTextPlain, richTextToMarkdown } from "./rich-text";
import { V1_BLOCK_TYPES, type NotionBlock, type NotionRichText } from "./types";

const HANDLED_BLOCK_TYPES = new Set([
  ...V1_BLOCK_TYPES,
  "toggle",
  "to_do",
  "bookmark",
  "link_preview",
  "embed",
  "equation",
  "table_of_contents",
  "breadcrumb",
]);

const IMAGE_MARKDOWN = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

export type ImageResolver = (args: {
  blockId: string;
  url: string;
  caption: string;
}) => Promise<string | null>;

export type ConvertContext = {
  warn: (message: string) => void;
  resolveImage: ImageResolver;
  /**
   * Column grids already emitted (image-only or mixed). The first grid's
   * first image in each column is eager; later grids stay lazy.
   */
  columnImageGrids?: number;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function splitMarkdownBlocks(markdown: string): string[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let buf: string[] = [];
  let inFence = false;

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) blocks.push(text);
    buf = [];
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      buf.push(line);
      continue;
    }
    if (!inFence && line.trim() === "") {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();
  return blocks;
}

function unescapeMarkdown(text: string): string {
  return text.replace(/\\([\\`*_[\]<>])/g, "$1");
}

function inlineToHtml(text: string): string {
  const slots: string[] = [];
  const slot = (html: string): string => {
    const index = slots.length;
    slots.push(html);
    return `\u0000${index}\u0000`;
  };

  let s = text.replace(/`([^`]+)`/g, (_, code: string) =>
    slot(`<code>${escapeHtml(code)}</code>`)
  );
  s = s.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, label: string, href: string) =>
      slot(`<a href="${escapeHtml(href)}">${inlineToHtml(label)}</a>`)
  );
  s = escapeHtml(unescapeMarkdown(s));
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
  s = s.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>");
  return s.replace(/\u0000(\d+)\u0000/g, (_, index: string) => {
    return slots[Number(index)] ?? "";
  });
}

function renderCodeFence(block: string): string {
  const match = block.match(/^```([^\n]*)\n?([\s\S]*?)```$/);
  const lang = match?.[1]?.trim().split(/\s+/)[0] ?? "";
  const body = (match?.[2] ?? block).replace(/\n$/, "");
  const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
  return `<pre><code${cls}>${escapeHtml(body)}</code></pre>`;
}

function renderTable(block: string): string | null {
  const lines = block.split("\n").filter(line => line.trim());
  if (lines.length < 2 || !lines.every(line => line.includes("|"))) {
    return null;
  }
  const parseRow = (line: string): string[] =>
    line
      .replace(/^\||\|$/g, "")
      .split("|")
      .map(cell => cell.trim());
  const isSep = (line: string): boolean =>
    parseRow(line).every(cell => /^:?-{3,}:?$/.test(cell));
  const sepIndex = lines.findIndex(isSep);
  if (sepIndex < 1) return null;

  const header = parseRow(lines[0] ?? "");
  const body = lines.slice(sepIndex + 1).map(parseRow);
  const th = header.map(cell => `<th>${inlineToHtml(cell)}</th>`).join("");
  const tr = body
    .map(
      row =>
        `<tr>${row.map(cell => `<td>${inlineToHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

function isListBlock(block: string): boolean {
  return block.split("\n").every(line => {
    const trimmed = line.trim();
    return (
      !trimmed ||
      /^[-*] /.test(trimmed) ||
      /^\d+\. /.test(trimmed) ||
      /^- \[[ x]\] /i.test(trimmed)
    );
  });
}

function renderList(block: string): string {
  const lines = block.split("\n").filter(line => line.trim());
  const numbered = /^\d+\.\s/.test(lines[0]?.trim() ?? "");
  const tag = numbered ? "ol" : "ul";
  const items = lines.map(line => {
    const trimmed = line.trim();
    const todo = trimmed.match(/^- \[([ x])\] (.*)$/i);
    if (todo) {
      const mark = todo[1]?.toLowerCase() === "x" ? "☑ " : "☐ ";
      return `<li>${mark}${inlineToHtml(todo[2] ?? "")}</li>`;
    }
    const item = trimmed.replace(/^(?:[-*]|\d+\.)\s+/, "");
    return `<li>${inlineToHtml(item)}</li>`;
  });
  return `<${tag}>${items.join("")}</${tag}>`;
}

function parseImageMarkdown(block: string): {
  alt: string;
  url: string;
  caption: string;
} | null {
  const match = block.trim().match(IMAGE_MARKDOWN);
  if (!match) return null;
  return {
    alt: match[1] ?? "image",
    url: match[2] ?? "",
    caption: match[3] ?? "",
  };
}

/**
 * Column grids are raw HTML, so they never pass through rehypeWebpImages.
 * Dimensions, aspect-ratio, and loading have to be written here.
 */
async function figureHtml(
  image: {
    alt: string;
    url: string;
    caption: string;
  },
  loading: "eager" | "lazy",
  fetchPriority?: "high"
): Promise<string> {
  const attrs = postImageAttrs(image.url);
  const size = await resolveImageSize(image.url).catch(() => null);
  const alt = escapeHtml(image.alt || "image");
  const src = escapeHtml(attrs.src);
  const lightbox = escapeHtml(attrs.lightboxSrc);
  const srcset = attrs.srcset ? ` srcset="${escapeHtml(attrs.srcset)}"` : "";
  const sizes = attrs.sizes ? ` sizes="${escapeHtml(attrs.sizes)}"` : "";
  const box =
    size && size.width > 0 && size.height > 0
      ? ` width="${size.width}" height="${size.height}" style="aspect-ratio: ${size.width} / ${size.height}"`
      : "";
  const priority = fetchPriority === "high" ? ` fetchpriority="high"` : "";
  const caption = image.caption.trim();
  const cap = caption ? `<figcaption>▲${escapeHtml(caption)}</figcaption>` : "";
  return `<figure class="figure-image" data-src="${lightbox}"><img src="${src}"${srcset}${sizes}${box} alt="${alt}" loading="${loading}" decoding="async"${priority} />${cap}</figure>`;
}

async function renderMarkdownBlock(
  block: string,
  loading: "eager" | "lazy",
  fetchPriority?: "high"
): Promise<string> {
  const image = parseImageMarkdown(block);
  if (image) return figureHtml(image, loading, fetchPriority);

  if (block === "---" || block === "***" || block === "___") return "<hr />";

  if (block.startsWith("```")) return renderCodeFence(block);

  const heading = block.match(/^(#{1,3})\s+(.+)$/);
  if (heading) {
    const level = heading[1]?.length ?? 2;
    return `<h${level}>${inlineToHtml(heading[2] ?? "")}</h${level}>`;
  }

  if (block.split("\n").every(line => /^>\s?/.test(line) || !line.trim())) {
    const inner = block
      .split("\n")
      .map(line => line.replace(/^>\s?/, ""))
      .join("\n")
      .trim();
    const html = await columnMarkdownToHtml(inner, false, 0);
    return `<blockquote>${html}</blockquote>`;
  }

  const table = renderTable(block);
  if (table) return table;

  if (isListBlock(block)) return renderList(block);

  return `<p>${inlineToHtml(block.replace(/\n/g, "<br />"))}</p>`;
}

async function columnMarkdownToHtml(
  markdown: string,
  eagerFirstImage: boolean,
  columnIndex: number
): Promise<string> {
  let imageIndex = 0;
  const parts: string[] = [];
  for (const block of splitMarkdownBlocks(markdown)) {
    const image = parseImageMarkdown(block);
    if (image) {
      const eager = eagerFirstImage && imageIndex === 0;
      parts.push(
        await figureHtml(
          image,
          eager ? "eager" : "lazy",
          eager && columnIndex === 0 ? "high" : undefined
        )
      );
      imageIndex += 1;
      continue;
    }
    parts.push(await renderMarkdownBlock(block, "lazy"));
  }
  return parts.join("");
}

async function columnGrid(
  columns: string[],
  eagerFirstImages: boolean
): Promise<string> {
  const count = Math.min(Math.max(columns.length, 2), 4);
  const inner = await Promise.all(
    columns.map(async (markdown, columnIndex) => {
      const html = await columnMarkdownToHtml(
        markdown,
        eagerFirstImages,
        columnIndex
      );
      return `<div class="notion-column">${html}</div>`;
    })
  );
  return `<div class="notion-columns" data-cols="${count}">${inner.join("")}</div>`;
}

async function convertColumnList(
  block: NotionBlock,
  ctx: ConvertContext
): Promise<string> {
  const columns = (block.children ?? []).filter(col => col.type === "column");
  const sources = columns.length ? columns : (block.children ?? []);
  const markdowns: string[] = [];
  for (const column of sources) {
    const md = await convertChildren(
      column.type === "column" ? column.children : [column],
      ctx,
      0
    );
    if (md.trim()) markdowns.push(md);
  }
  if (!markdowns.length) return "";
  if (markdowns.length === 1) return markdowns[0] ?? "";
  const gridIndex = ctx.columnImageGrids ?? 0;
  ctx.columnImageGrids = gridIndex + 1;
  return columnGrid(markdowns, gridIndex === 0);
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

  if (!HANDLED_BLOCK_TYPES.has(type) && type !== "table_row") {
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
      return convertColumnList(block, ctx);
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
