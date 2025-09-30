import { B as BLOG_PATH } from './content.config_Lj1yXH8X.mjs';
import { s as slugifyStr } from './slugify_CvQuO4Tx.mjs';

function getPath(id, filePath, includeBase = true) {
  const pathSegments = filePath?.replace(BLOG_PATH, "").split("/").filter((path) => path !== "").filter((path) => !path.startsWith("_")).slice(0, -1).map((segment) => slugifyStr(segment));
  const basePath = includeBase ? "/posts" : "";
  const blogId = id.split("/");
  const slug = blogId.length > 0 ? blogId.slice(-1) : blogId;
  if (!pathSegments || pathSegments.length < 1) {
    return [basePath, slug].join("/");
  }
  return [basePath, ...pathSegments, slug].join("/");
}

export { getPath as g };
