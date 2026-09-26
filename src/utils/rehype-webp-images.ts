import { postImageAttrs } from "./assets";
import { resolveImageSize } from "./image-size";

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function walk(
  node: HastNode,
  visit: (node: HastNode, parent: HastNode | null) => void,
  parent: HastNode | null = null
): void {
  visit(node, parent);
  for (const child of node.children ?? []) walk(child, visit, node);
}

function positive(value: unknown): number | undefined {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  if (!Number.isFinite(numeric) || numeric < 1) return undefined;
  return Math.round(numeric);
}

function mergeStyle(existing: unknown, addition: string): string {
  if (typeof existing !== "string" || !existing.trim()) return addition;
  const base = existing.trim().replace(/;+\s*$/, "");
  if (/(^|;)\s*aspect-ratio\s*:/.test(base)) return existing.trim();
  return `${base}; ${addition}`;
}

async function applyImage(
  node: HastNode,
  parent: HastNode | null
): Promise<void> {
  const props = node.properties ?? {};
  const src = props.src;
  if (typeof src !== "string" || !src) return;

  const attrs = postImageAttrs(src);
  const rewritten = attrs.src !== src || Boolean(attrs.srcset);
  let width = positive(props.width);
  let height = positive(props.height);
  let fromProbe = false;
  if (!width || !height) {
    const size = await resolveImageSize(src).catch(() => null);
    if (size) {
      width = size.width;
      height = size.height;
      fromProbe = true;
    }
  }
  if (!rewritten && !fromProbe) return;

  node.properties = {
    ...props,
    ...(rewritten
      ? {
          src: attrs.src,
          ...(attrs.srcset ? { srcSet: attrs.srcset } : {}),
          ...(attrs.sizes ? { sizes: attrs.sizes } : {}),
        }
      : {}),
    ...(fromProbe && width && height
      ? {
          width,
          height,
          style: mergeStyle(props.style, `aspect-ratio: ${width} / ${height}`),
        }
      : {}),
    loading: typeof props.loading === "string" ? props.loading : "lazy",
    decoding: "async",
  };

  if (parent?.type === "element" && parent.tagName === "figure") {
    parent.properties = {
      ...parent.properties,
      dataSrc: attrs.lightboxSrc,
    };
  }
}

/**
 * Markdown `![alt](https://d28ebb3.webp.li/...)` would otherwise render a
 * full-origin URL (and a fake Astro srcset of the same URL). Rewrite to real
 * `width=` variants and point lightGallery at the proxy, not R2.
 * Missing width/height are filled from the image header so the box exists
 * before the file loads.
 */
export function rehypeWebpImages() {
  return async (tree: HastNode) => {
    const images: Array<{ node: HastNode; parent: HastNode | null }> = [];
    walk(tree, (node, parent) => {
      if (node.type !== "element" || node.tagName !== "img") return;
      images.push({ node, parent });
    });
    await Promise.all(
      images.map(({ node, parent }) => applyImage(node, parent))
    );
  };
}
