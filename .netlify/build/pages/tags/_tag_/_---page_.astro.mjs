import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, f as addAttribute, g as renderTransition, m as maybeRenderHead } from '../../../chunks/astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import { g as getCollection } from '../../../chunks/_astro_content_DO-0ymuU.mjs';
import { $ as $$Main } from '../../../chunks/Main_CwjC9wxw.mjs';
import { $ as $$Layout, a as $$Header, c as $$Footer } from '../../../chunks/Footer_DyXL4eSp.mjs';
import { $ as $$Card } from '../../../chunks/Card_BQy9ZJh2.mjs';
import { $ as $$Pagination } from '../../../chunks/Pagination_a5muKent.mjs';
import { g as getUniqueTags } from '../../../chunks/getUniqueTags_BTV14xf4.mjs';
import { g as getSortedPosts } from '../../../chunks/getSortedPosts_DGYB0ctk.mjs';
import { a as slugifyAll } from '../../../chunks/slugify_CvQuO4Tx.mjs';
import { S as SITE } from '../../../chunks/config_Bu0bSZwp.mjs';
/* empty css                                       */
export { renderers } from '../../../renderers.mjs';

const getPostsByTag = (posts, tag) => getSortedPosts(
  posts.filter((post) => slugifyAll(post.data.tags).includes(tag))
);

const $$Astro = createAstro("https://blog.doooit.me/");
async function getStaticPaths({ paginate }) {
  const posts = await getCollection("blog");
  const tags = getUniqueTags(posts);
  return tags.flatMap(({ tag, tagName }) => {
    const tagPosts = getPostsByTag(posts, tag);
    return paginate(tagPosts, {
      params: { tag },
      props: { tagName },
      pageSize: SITE.postPerPage
    });
  });
}
const $$ = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  const params = Astro2.params;
  const { tag } = params;
  const { page, tagName } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `\u6807\u7B7E: ${tagName} | ${SITE.title}` }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "Main", $$Main, { "pageTitle": [`\u6807\u7B7E:`, `${tagName}`], "titleTransition": tag, "pageDesc": `\u5305\u542B\u6807\u7B7E "${tagName}" \u7684\u6587\u7AE0\u3002` }, { "default": async ($$result3) => renderTemplate`  ${maybeRenderHead()}<ul> ${page.data.map((data) => renderTemplate`${renderComponent($$result3, "Card", $$Card, { ...data })}`)} </ul> `, "title": async ($$result3) => renderTemplate`<h1${addAttribute(renderTransition($$result3, "7yucybdb", "", tag), "data-astro-transition-scope")}>${`Tag:${tag}`}</h1>` })} ${renderComponent($$result2, "Pagination", $$Pagination, { "page": page })} ${renderComponent($$result2, "Footer", $$Footer, { "noMarginTop": page.lastPage > 1 })} ` })}`;
}, "/Users/dumengjie/code/astro-paper/src/pages/tags/[tag]/[...page].astro", "self");

const $$file = "/Users/dumengjie/code/astro-paper/src/pages/tags/[tag]/[...page].astro";
const $$url = "/tags/[tag]/[...page]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
