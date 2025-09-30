import { c as createComponent, r as renderComponent, e as renderScript, a as renderTemplate, m as maybeRenderHead, F as Fragment } from '../chunks/astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import { g as getCollection } from '../chunks/_astro_content_DO-0ymuU.mjs';
import '@astrojs/internal-helpers/path';
import '@astrojs/internal-helpers/remote';
import '../chunks/index_MaT6fT73.mjs';
import { Image as $$ResponsiveImage } from '../chunks/_astro_assets_D9pPgi1P.mjs';
import { $ as $$Layout, a as $$Header, S as SOCIALS, e as $$Socials, f as $$Hr, b as $$LinkButton, c as $$Footer } from '../chunks/Footer_DyXL4eSp.mjs';
import { $ as $$Card } from '../chunks/Card_BQy9ZJh2.mjs';
import { g as getSortedPosts } from '../chunks/getSortedPosts_DGYB0ctk.mjs';
import { I as IconArrowRight } from '../chunks/IconArrowRight_D2fAUHFk.mjs';
import { S as SITE } from '../chunks/config_Bu0bSZwp.mjs';
export { renderers } from '../renderers.mjs';

const cuteBear = new Proxy({"src":"/_astro/cute_bear.DXRCBOhu.png","width":1024,"height":1024,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "/Users/dumengjie/code/astro-paper/src/assets/images/cute_bear.png";
							}
							
							return target[name];
						}
					});

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  const featuredPosts = sortedPosts.filter(({ data }) => data.featured);
  const recentPosts = sortedPosts.filter(({ data }) => !data.featured);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main id="main-content" data-layout="index"> <section id="hero" class="flex items-center gap-12 pt-8 pb-6"> <div> <h1 class="mt-0 mb-2 inline-block text-3xl font-bold sm:mb-4 sm:text-4xl">
doit 杜伊特
</h1> <p class="text-balance text-foreground/80 italic">
"To see the world, things dangerous to come to, to see behind walls,
          to draw closer, to find each other and to feel. That is the purpose of
          life."
</p> ${// only display if at least one social link is enabled
  SOCIALS.length > 0 && renderTemplate`<div class="mt-2 sm:mt-4"> ${renderComponent($$result2, "Socials", $$Socials, {})} </div>`} </div> <div class="hidden sm:block"> ${renderComponent($$result2, "Image", $$ResponsiveImage, { "src": cuteBear, "alt": "A Cute Bear.", "height": "480" })} </div> </section> ${renderComponent($$result2, "Hr", $$Hr, {})} ${featuredPosts.length > 0 && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <section id="featured" class="pt-12 pb-6"> <h2 class="text-2xl font-semibold tracking-wide">推荐文章</h2> <ul> ${featuredPosts.map((data) => renderTemplate`${renderComponent($$result3, "Card", $$Card, { "variant": "h3", ...data })}`)} </ul> </section> ${recentPosts.length > 0 && renderTemplate`${renderComponent($$result3, "Hr", $$Hr, {})}`}` })}`} ${recentPosts.length > 0 && renderTemplate`<section id="recent-posts" class="pt-12 pb-6"> <h2 class="text-2xl font-semibold tracking-wide">最新文章</h2> <ul> ${recentPosts.map(
    (data, index) => index < SITE.postPerIndex && renderTemplate`${renderComponent($$result2, "Card", $$Card, { "variant": "h3", ...data })}`
  )} </ul> </section>`} <div class="my-8 text-center"> ${renderComponent($$result2, "LinkButton", $$LinkButton, { "class": "inline-flex items-center", "href": "/posts/" }, { "default": async ($$result3) => renderTemplate`
全部文章
${renderComponent($$result3, "IconArrowRight", IconArrowRight, { "class": "inline-block rtl:-rotate-180" })} ` })} </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })} ${renderScript($$result, "/Users/dumengjie/code/astro-paper/src/pages/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/dumengjie/code/astro-paper/src/pages/index.astro", void 0);

const $$file = "/Users/dumengjie/code/astro-paper/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
