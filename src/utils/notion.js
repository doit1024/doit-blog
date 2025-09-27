import { NotionAPI } from "notion-client";

const notionClient = new NotionAPI();

export async function getMicroBlogData() {
  const collectionId = "27063591-2071-804b-a600-000b022cce0b";
  const collectionViewId = "27063591-2071-804b-88f6-000c9db68426";
  const collectionData = await notionClient.getCollectionData(
    collectionId,
    collectionViewId
  );
  const { allBlockIds } = collectionData;

  const allBlocksData = await Promise.all(
    allBlockIds.reverse().map((id) => notionClient.getPage(id))
  )

  return allBlocksData;
}
