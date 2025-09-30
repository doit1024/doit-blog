import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import { $ as $$Layout, a as $$Header, b as $$LinkButton, c as $$Footer } from '../chunks/Footer_DyXL4eSp.mjs';
import { S as SITE } from '../chunks/config_Bu0bSZwp.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `404 Not Found | ${SITE.title}` }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${maybeRenderHead()}<main id="main-content" class="mx-auto flex max-w-app flex-1 items-center justify-center"> <div class="mb-14 flex flex-col items-center justify-center"> <h1 class="text-9xl font-bold text-accent"> ${Math.round(Math.random() * 1e3)} </h1> <span aria-hidden="true">¯\\_(ツ)_/¯</span> <p class="mt-4 text-2xl sm:text-3xl">Page Not Found</p> ${renderComponent($$result2, "LinkButton", $$LinkButton, { "href": "/", "class": "my-6 text-lg underline decoration-dashed underline-offset-8" }, { "default": ($$result3) => renderTemplate`
返回首页
` })} </div> </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/Users/dumengjie/code/astro-paper/src/pages/404.astro", void 0);

const $$file = "/Users/dumengjie/code/astro-paper/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
