import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import { g as getCollection } from '../chunks/_astro_content_DO-0ymuU.mjs';
import { $ as $$Main } from '../chunks/Main_CwjC9wxw.mjs';
import { $ as $$Layout, a as $$Header, c as $$Footer } from '../chunks/Footer_DyXL4eSp.mjs';
import { $ as $$Tag } from '../chunks/Tag_H4t5LUVy.mjs';
import { g as getUniqueTags } from '../chunks/getUniqueTags_BTV14xf4.mjs';
import { S as SITE } from '../chunks/config_Bu0bSZwp.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const posts = await getCollection("blog");
  let tags = getUniqueTags(posts);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `\u6807\u7B7E | ${SITE.title}` }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "Main", $$Main, { "pageTitle": "\u6807\u7B7E", "pageDesc": `\u6587\u7AE0\u4E2D\u4F7F\u7528\u5230\u7684\u6807\u7B7E\uFF0C\u5171 ${tags.length} \u4E2A\u3002` }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<ul> ${tags.map(({ tag, tagName }) => renderTemplate`${renderComponent($$result3, "Tag", $$Tag, { "tag": tag, "tagName": tagName, "size": "lg" })}`)} </ul> ` })} ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/Users/dumengjie/code/astro-paper/src/pages/tags/index.astro", void 0);

const $$file = "/Users/dumengjie/code/astro-paper/src/pages/tags/index.astro";
const $$url = "/tags";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
