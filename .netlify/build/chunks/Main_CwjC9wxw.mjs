import { b as createAstro, c as createComponent, m as maybeRenderHead, f as addAttribute, d as renderSlot, e as renderScript, r as renderComponent, a as renderTemplate, g as renderTransition } from './astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import { $ as $$Breadcrumb } from './Breadcrumb_DpVJfhXJ.mjs';
/* empty css                         */

const $$Astro = createAstro("https://blog.doooit.me/");
const $$Main = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Main;
  const { props } = Astro2;
  const showBreadcrumb = props.showBreadcrumb ?? true;
  const backUrl = Astro2.url.pathname ;
  return renderTemplate`${showBreadcrumb && renderTemplate`${renderComponent($$result, "Breadcrumb", $$Breadcrumb, {})}`}${maybeRenderHead()}<main${addAttribute(backUrl, "data-backUrl")} id="main-content"${addAttribute(["mx-auto w-full max-w-app px-4 pb-4", !showBreadcrumb && "mt-6"], "class:list")}> ${"titleTransition" in props ? renderTemplate`<h1 class="text-2xl font-semibold sm:text-3xl"> ${props.pageTitle[0]} <span${addAttribute(renderTransition($$result, "sevnwjn5", "", props.titleTransition), "data-astro-transition-scope")}> ${props.pageTitle[1]} </span> </h1>` : renderTemplate`<h1 class="text-2xl font-semibold sm:text-3xl">${props.pageTitle}</h1>`} <p class="mt-2 mb-6 italic">${props.pageDesc}</p> ${renderSlot($$result, $$slots["default"])} </main> ${renderScript($$result, "/Users/dumengjie/code/astro-paper/src/layouts/Main.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/dumengjie/code/astro-paper/src/layouts/Main.astro", "self");

export { $$Main as $ };
