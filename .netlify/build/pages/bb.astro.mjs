import { b as createAstro, c as createComponent, m as maybeRenderHead, r as renderComponent, a as renderTemplate } from '../chunks/astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
/* empty css                              */
import { $ as $$Main } from '../chunks/Main_CwjC9wxw.mjs';
import { $ as $$Layout, a as $$Header, c as $$Footer } from '../chunks/Footer_DyXL4eSp.mjs';
import { S as SITE } from '../chunks/config_Bu0bSZwp.mjs';
import { NotionAPI } from 'notion-client';
import { NotionRenderer } from 'react-notion-x';
import dayjs from 'dayjs';
/* empty css                              */
export { renderers } from '../renderers.mjs';

const notionClient = new NotionAPI();

async function getMicroBlogData() {
  const collectionId = "27063591-2071-804b-a600-000b022cce0b";
  const collectionViewId = "27063591-2071-804b-88f6-000c9db68426";
  const collectionData = await notionClient.getCollectionData(
    collectionId,
    collectionViewId
  );
  const { allBlockIds } = collectionData;

  const allBlocksData = await Promise.all(
    allBlockIds.reverse().map((id) => notionClient.getPage(id))
  );

  return allBlocksData;
}

const $$Astro = createAstro("https://blog.doooit.me/");
const $$MicroBlog = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$MicroBlog;
  const { blockData } = Astro2.props;
  const pageBlock = Object.values(blockData.block).find(
    (block) => block.value.type === "page"
  );
  const createdTime = pageBlock.value.created_time;
  const tagString = pageBlock.value.properties.rRiX?.[0]?.[0] ?? "";
  const tags = tagString.split(",");
  return renderTemplate`${maybeRenderHead()}<div class="rounded-lg border border-border p-6"> ${renderComponent($$result, "NotionRenderer", NotionRenderer, { "recordMap": blockData, "fullPage": false, "darkMode": false })} <div class="flex items-center justify-between text-sm text-foreground/60"> <div class="flex gap-1"> ${tags.map((tag) => renderTemplate`<span>#${tag}</span>`)} </div> <time datetime="2025-09-27" class="block">${dayjs(createdTime).format("YYYY-MM-DD HH:mm:ss")}</time> </div> </div>`;
}, "/Users/dumengjie/code/astro-paper/src/components/MicroBlog.astro", void 0);

const $$Bb = createComponent(async ($$result, $$props, $$slots) => {
  const microBlogData = await getMicroBlogData();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `\u5FAE\u535A | ${SITE.title}` }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "Main", $$Main, { "pageTitle": "\u5C0F\u58F0\u54D4\u54D4", "pageDesc": "\u77ED\u66F4\u65B0\u548C\u788E\u788E\u5FF5", "showBreadcrumb": false }, { "default": async ($$result3) => renderTemplate`  ${maybeRenderHead()}<div class="flex flex-col gap-4">${microBlogData.map((item) => renderTemplate`${renderComponent($$result3, "MicroBlog", $$MicroBlog, { "blockData": item })}`)}</div> ` })} ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/Users/dumengjie/code/astro-paper/src/pages/bb.astro", void 0);

const $$file = "/Users/dumengjie/code/astro-paper/src/pages/bb.astro";
const $$url = "/bb";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Bb,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
