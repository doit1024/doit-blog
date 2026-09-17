import type { NotionRichText } from "./types";

function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_[\]<>])/g, "\\$1");
}

function wrap(text: string, marker: string): string {
  if (!text) return text;
  return `${marker}${text}${marker}`;
}

export function richTextToMarkdown(
  parts: NotionRichText[] | undefined
): string {
  if (!parts?.length) return "";

  return parts
    .map(part => {
      if (part.type === "equation") {
        const expr = part.equation?.expression?.trim();
        return expr ? `$${expr}$` : "";
      }

      const href = part.href ?? part.text?.link?.url ?? null;
      const raw = part.plain_text ?? part.text?.content ?? "";
      if (!raw) return "";

      const annotations = part.annotations;
      let text = annotations?.code ? raw : escapeMarkdown(raw);

      if (annotations?.code) text = wrap(text, "`");
      if (annotations?.bold) text = wrap(text, "**");
      if (annotations?.italic) text = wrap(text, "*");
      if (annotations?.strikethrough) text = wrap(text, "~~");
      if (annotations?.underline) text = `<u>${text}</u>`;

      if (href) {
        const safeHref = href.replace(/[)\s]/g, encodeURIComponent);
        text = `[${text}](${safeHref})`;
      }

      return text;
    })
    .join("");
}

export function richTextPlain(parts: NotionRichText[] | undefined): string {
  if (!parts?.length) return "";
  return parts.map(part => part.plain_text ?? "").join("");
}
