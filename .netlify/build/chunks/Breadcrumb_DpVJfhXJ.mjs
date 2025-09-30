import { b as createAstro, c as createComponent, m as maybeRenderHead, f as addAttribute, a as renderTemplate } from './astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import 'clsx';

const $$Astro = createAstro("https://blog.doooit.me/");
const $$Breadcrumb = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Breadcrumb;
  const titlePathMap = {
    posts: "\u6587\u7AE0",
    tags: "\u6807\u7B7E",
    about: "\u5173\u4E8E",
    archives: "\u5F52\u6863"
  };
  const pathTitleMap = Object.fromEntries(Object.entries(titlePathMap).map(([key, value]) => [value, key]));
  const currentUrlPath = Astro2.url.pathname.replace(/\/+$/, "");
  const breadcrumbList = currentUrlPath.split("/").slice(1);
  if (titlePathMap[breadcrumbList[0]]) {
    breadcrumbList.splice(0, 1, titlePathMap[breadcrumbList[0]]);
  }
  if (breadcrumbList[0] === "\u6587\u7AE0" && !isNaN(Number(breadcrumbList[1]))) {
    breadcrumbList.splice(
      1,
      1
    );
  }
  if (breadcrumbList[0] === "\u6807\u7B7E" && !isNaN(Number(breadcrumbList[2]))) {
    breadcrumbList.splice(
      2,
      1
    );
  }
  return renderTemplate`${maybeRenderHead()}<nav class="mx-auto mt-8 mb-2 w-full max-w-app px-4" aria-label="breadcrumb"> <ul class="font-normal [&>li]:inline [&>li:not(:last-child)>a]:hover:opacity-100"> <li> <a href="/" class="opacity-80">首页</a> <span aria-hidden="true" class="opacity-80">&raquo;</span> </li> ${breadcrumbList.map(
    (breadcrumb, index) => index + 1 === breadcrumbList.length ? renderTemplate`<li> <span${addAttribute(["capitalize opacity-75", { lowercase: index > 0 }], "class:list")} aria-current="page">  ${decodeURIComponent(breadcrumb)} </span> </li>` : renderTemplate`<li> <a${addAttribute(`/${pathTitleMap[breadcrumb]}/`, "href")} class="capitalize opacity-70"> ${breadcrumb} </a> <span aria-hidden="true">&raquo;</span> </li>`
  )} </ul> </nav>`;
}, "/Users/dumengjie/code/astro-paper/src/components/Breadcrumb.astro", void 0);

export { $$Breadcrumb as $ };
