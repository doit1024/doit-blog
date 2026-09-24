import type { Loader } from "astro/loaders";

import { loadMediaLibrary } from "@/utils/media-library/load";

const EMPTY_ROW = {
  title: "",
  type: null,
  year: null,
  date: null,
  status: null,
  cover: null,
  url: null,
  note: null,
  rating: null,
  created: null,
  playHours: null,
};

export function mediaLoader(): Loader {
  return {
    name: "media-library",
    load: async ({ store, logger, parseData, generateDigest }) => {
      // Astro warns if a loader collection has zero entries. A blank row
      // keeps /library prerenderable when Notion is skipped.
      const keepEmpty = async () => {
        store.clear();
        const parsed = await parseData({ id: "empty", data: EMPTY_ROW });
        store.set({
          id: "empty",
          data: parsed,
          digest: generateDigest("empty"),
        });
      };

      let items;
      try {
        items = await loadMediaLibrary(logger);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`library: load failed, skip media source: ${message}`);
        await keepEmpty();
        return;
      }

      if (items.length === 0) {
        await keepEmpty();
        return;
      }

      store.clear();

      for (const item of items) {
        const data = {
          title: item.title,
          type: item.type,
          year: item.year,
          date: item.date,
          status: item.status,
          cover: item.cover,
          url: item.url,
          note: item.note,
          rating: item.rating,
          created: item.created,
          playHours: item.playHours,
        };
        const parsed = await parseData({ id: item.id, data });
        store.set({
          id: item.id,
          data: parsed,
          digest: generateDigest(JSON.stringify(parsed)),
        });
      }
    },
  };
}
