import { b as createAstro, c as createComponent, m as maybeRenderHead, f as addAttribute, g as renderTransition, a as renderTemplate } from './astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                         */

const $$Astro = createAstro("https://blog.doooit.me/");
const $$Tag = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Tag;
  const { tag, tagName, size = "sm" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<li${addAttribute([
    "group inline-block group-hover:cursor-pointer",
    "underline decoration-dashed focus-visible:no-underline",
    size === "sm" ? "my-1 underline-offset-4" : "mx-1 my-3 underline-offset-8"
  ], "class:list")}> <a${addAttribute(`/tags/${tag}/`, "href")}${addAttribute([
    "block pe-2 group-hover:text-accent focus-visible:p-1 ",
    { "text-sm group-hover:-translate-y-0.5": size === "sm", "text-lg group-hover:-translate-y-1": size === "lg" }
  ], "class:list")}${addAttribute(renderTransition($$result, "36ssibgs", "", tag), "data-astro-transition-scope")}>
# ${tagName} </a> </li>`;
}, "/Users/dumengjie/code/astro-paper/src/components/Tag.astro", "self");

export { $$Tag as $ };
