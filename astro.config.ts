import { defineConfig, envField, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeFigureTitle from "rehype-figure-title";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { SITE } from "./src/config";

import react from "@astrojs/react";

import mdx from "@astrojs/mdx";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,

  prefetch: true,

  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
    react(),
    mdx(),
  ],

  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    rehypePlugins: [[rehypeFigureTitle, { className: "figure-image" }]],
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "github-light", dark: "dark-plus" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },

  vite: {
    // eslint-disable-next-line
    // @ts-ignore
    // This will be fixed in Astro 6 with Vite 7 support
    // See: https://github.com/withastro/astro/issues/14030
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
    ssr: {
      external: [
        "@resvg/resvg-js",
        "fs",
        "path",
        "os",
        "url",
        "tty",
        "crypto",
        "child_process",
        "node:fs",
        "node:path",
        "node:url",
        "node:http2",
        "node:buffer",
        "node:crypto",
        "worker_threads",
        "module",
        "node:fs/promises",
      ],
    },
  },

  image: {
    responsiveStyles: true,
    layout: "constrained",
  },

  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },

  experimental: {
    preserveScriptOrder: true,
    fonts: [
      {
        provider: fontProviders.fontsource(),
        name: "Poppins",
        cssVariable: "--font-poppins",
        weights: [400, 500, 600, 700],
      },
    ],
  },

  adapter: cloudflare(),
});
