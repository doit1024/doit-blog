import { defineCollection, z } from "astro:content";
import { SITE } from "@/config";
import { blogLoader } from "@/loaders/blog";
import { mediaLoader } from "@/loaders/media";

export const BLOG_PATH = "src/data/blog";

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
      preview: z.boolean().optional(),
    }),
});

const media = defineCollection({
  loader: mediaLoader(),
  schema: z.object({
    title: z.string(),
    type: z.string().nullable(),
    year: z.string().nullable(),
    date: z.string().nullable(),
    status: z.string().nullable(),
    cover: z.string().nullable(),
    url: z.string().nullable(),
    note: z.string().nullable(),
    rating: z.number().nullable().default(null),
    created: z.string().nullable().default(null),
    playHours: z.number().nullable().default(null),
    artist: z.string().nullable().default(null),
  }),
});

export const collections = { blog, media };
