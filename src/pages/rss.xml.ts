import rss from "@astrojs/rss";
import { getCollection, render } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";
import { loadRenderers } from "astro:container";
import { experimental_AstroContainer } from "astro/container";
import { getContainerRenderer } from "@astrojs/mdx";

export async function GET() {
  const renderers = await loadRenderers([getContainerRenderer()]);
  const container = await experimental_AstroContainer.create({ renderers });
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);

  const items = [];
  for (const post of sortedPosts) {
    const { data, id, filePath } = post;
    const { Content } = await render(post);
    const content = await container.renderToString(Content);
    items.push({
      ...post.data,
      link: getPath(id, filePath),
      content,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    });
  }

  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items,
  });
}
