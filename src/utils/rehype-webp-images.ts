import { postImageAttrs } from "./assets";

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

/**
 * Markdown `![alt](https://d28ebb3.webp.li/...)` would otherwise render a
 * full-origin URL (and a fake Astro srcset of the same URL). Rewrite to real
 * `width=` variants and point lightGallery at the proxy, not R2.
 */
export function rehypeWebpImages() {
  return (tree: HastNode) => {
    walk(tree, (node, parent) => {
      if (node.type !== "element" || node.tagName !== "img") return;
      const src = node.properties?.src;
      if (typeof src !== "string" || !src) return;

      const attrs = postImageAttrs(src);
      if (attrs.src === src && !attrs.srcset) return;

      node.properties = {
        ...node.properties,
        src: attrs.src,
        ...(attrs.srcset ? { srcSet: attrs.srcset } : {}),
        ...(attrs.sizes ? { sizes: attrs.sizes } : {}),
        loading:
          typeof node.properties?.loading === "string"
            ? node.properties.loading
            : "lazy",
        decoding: "async",
      };

      if (parent?.type === "element" && parent.tagName === "figure") {
        parent.properties = {
          ...parent.properties,
          dataSrc: attrs.lightboxSrc,
        };
      }
    });
  };
}
