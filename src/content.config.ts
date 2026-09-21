import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "@/config";
import { blogLoader } from "@/loaders/blog";

export const BLOG_PATH = "src/data/blog";
export const WORKS_PATH = "src/data/works";

const blog = defineCollection({
  loader: blogLoader({ globBase: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
    }),
});

const works = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: `./${WORKS_PATH}`,
  }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.string(),
      href: z.string(),
      image: image(),
      imageAlt: z.string(),
      featured: z.boolean().default(true),
      order: z.number(),
      external: z.boolean().default(false),
    }),
});

export const collections = { blog, works };
