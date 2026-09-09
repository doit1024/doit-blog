import { NotionAPI } from "notion-client";

const collectionId = "27063591-2071-804b-a600-000b022cce0b";
const collectionViewId = "27063591-2071-804b-88f6-000c9db68426";

/**
 * Notion public endpoints sometimes reject custom `*.notion.site` bases
 * (queryCollection → 403) while `www.notion.so` still works, and vice versa
 * for intermittent 503s. Try a few bases and keep the first that returns rows.
 */
const API_BASES = [
  undefined, // notion-client default (www.notion.so)
  "https://www.notion.so/api/v3",
  "https://doooit.notion.site/api/v3",
];

function createClient(apiBaseUrl) {
  return apiBaseUrl ? new NotionAPI({ apiBaseUrl }) : new NotionAPI();
}

export async function getMicroBlogData() {
  let lastError;

  for (const apiBaseUrl of API_BASES) {
    try {
      const notionClient = createClient(apiBaseUrl);
      const collectionData = await notionClient.getCollectionData(
        collectionId,
        collectionViewId
      );
      const allBlockIds = collectionData?.allBlockIds ?? [];

      if (!allBlockIds.length) {
        console.warn(
          "getMicroBlogData: empty allBlockIds via",
          apiBaseUrl ?? "default"
        );
        continue;
      }

      const allBlocksData = await Promise.all(
        allBlockIds.reverse().map(id => notionClient.getPage(id))
      );

      return allBlocksData;
    } catch (err) {
      lastError = err;
      console.error(
        "getMicroBlogData failed via",
        apiBaseUrl ?? "default",
        err
      );
    }
  }

  console.error("getMicroBlogData exhausted API bases", lastError);
  return [];
}
