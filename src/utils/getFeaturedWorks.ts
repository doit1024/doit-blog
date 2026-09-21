import { getCollection } from "astro:content";

/** Homepage always shows this many featured works. */
export const HOMEPAGE_WORKS = 3;

export default async function getFeaturedWorks() {
  const works = await getCollection("works");
  return works
    .filter(work => work.data.featured)
    .sort((a, b) => a.data.order - b.data.order)
    .slice(0, HOMEPAGE_WORKS);
}
