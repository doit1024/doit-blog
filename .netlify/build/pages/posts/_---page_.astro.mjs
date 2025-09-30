import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import { g as getCollection } from '../../chunks/_astro_content_DO-0ymuU.mjs';
import { $ as $$Main } from '../../chunks/Main_CwjC9wxw.mjs';
import { $ as $$Layout, a as $$Header, c as $$Footer } from '../../chunks/Footer_DyXL4eSp.mjs';
import { $ as $$Card } from '../../chunks/Card_BQy9ZJh2.mjs';
import { $ as $$Pagination } from '../../chunks/Pagination_a5muKent.mjs';
import { g as getSortedPosts } from '../../chunks/getSortedPosts_DGYB0ctk.mjs';
import { S as SITE } from '../../chunks/config_Bu0bSZwp.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://blog.doooit.me/");
const getStaticPaths = (async ({ paginate }) => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return paginate(getSortedPosts(posts), { pageSize: SITE.postPerPage });
});
const $$ = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  const { page } = Astro2.props;
  const allPosts = await getCollection("blog", ({ data }) => !data.draft);
  const totalPostsCount = allPosts.length;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `\u6587\u7AE0 | ${SITE.title}` }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "Main", $$Main, { "pageTitle": "\u6587\u7AE0", "pageDesc": `\u5DF2\u53D1\u5E03\u7684\u6587\u7AE0\uFF0C\u5171 ${totalPostsCount} \u7BC7\u3002` }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<ul> ${page.data.map((data) => renderTemplate`${renderComponent($$result3, "Card", $$Card, { ...data })}`)} </ul> ` })} ${renderComponent($$result2, "Pagination", $$Pagination, { "page": page })} ${renderComponent($$result2, "Footer", $$Footer, { "noMarginTop": page.lastPage > 1 })} ` })}`;
}, "/Users/dumengjie/code/astro-paper/src/pages/posts/[...page].astro", void 0);

const $$file = "/Users/dumengjie/code/astro-paper/src/pages/posts/[...page].astro";
const $$url = "/posts/[...page]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
