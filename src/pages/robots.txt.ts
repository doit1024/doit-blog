import type { APIRoute } from "astro";
import { notionPostsIncludePreview } from "@/utils/notion-posts/config";

const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

const getPreviewRobotsTxt = () => `
User-agent: *
Disallow: /
`;

export const GET: APIRoute = ({ site }) => {
  if (notionPostsIncludePreview()) {
    return new Response(getPreviewRobotsTxt());
  }
  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapURL));
};
