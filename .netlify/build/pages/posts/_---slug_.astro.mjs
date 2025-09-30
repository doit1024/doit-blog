import { b as createAstro, c as createComponent, a as renderTemplate, e as renderScript, m as maybeRenderHead, r as renderComponent, f as addAttribute, g as renderTransition } from '../../chunks/astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import { r as renderEntry, g as getCollection } from '../../chunks/_astro_content_DO-0ymuU.mjs';
import { d as createSvgComponent, b as $$LinkButton, $ as $$Layout, a as $$Header, c as $$Footer } from '../../chunks/Footer_DyXL4eSp.mjs';
import { $ as $$Tag } from '../../chunks/Tag_H4t5LUVy.mjs';
import { $ as $$Datetime } from '../../chunks/Datetime_Dvr1GMmS.mjs';
import 'clsx';
import { S as SITE } from '../../chunks/config_Bu0bSZwp.mjs';
import { g as getPath } from '../../chunks/getPath_BIrrwKL5.mjs';
import { s as slugifyStr } from '../../chunks/slugify_CvQuO4Tx.mjs';
/* empty css                                    */
import { g as getSortedPosts } from '../../chunks/getSortedPosts_DGYB0ctk.mjs';
export { renderers } from '../../renderers.mjs';

createSvgComponent({"meta":{"src":"/_astro/IconEdit.C9zdzJLB.svg","width":24,"height":24,"format":"svg"},"attributes":{"width":"24","height":"24","viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round","class":"icon icon-tabler icons-tabler-outline icon-tabler-edit"},"children":"<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\" /><path d=\"M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1\" /><path d=\"M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z\" /><path d=\"M16 5l3 3\" />"});

const $$Astro$2 = createAstro("https://blog.doooit.me/");
const $$EditPost = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$EditPost;
  const { hideEditPost, post, class: className = "" } = Astro2.props;
  `${SITE.editPost.url}${post.filePath}`;
  const showEditPost = SITE.editPost.enabled;
  return renderTemplate`${showEditPost}`;
}, "/Users/dumengjie/code/astro-paper/src/components/EditPost.astro", void 0);

const IconChevronLeft = createSvgComponent({"meta":{"src":"/_astro/IconChevronLeft.DuweWiRq.svg","width":24,"height":24,"format":"svg"},"attributes":{"width":"24","height":"24","viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round","class":"icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"},"children":"<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\" /><path d=\"M15 6l-6 6l6 6\" />"});

const $$BackButton = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderTemplate`${maybeRenderHead()}<div class="mx-auto flex w-full max-w-app items-center justify-start px-2">${renderComponent($$result, "LinkButton", $$LinkButton, { "id": "back-button", "href": "/", "class": "focus-outline mt-8 mb-2 flex hover:text-foreground/75" }, { "default": ($$result2) => renderTemplate`${renderComponent($$result2, "IconChevronLeft", IconChevronLeft, { "class": "inline-block size-6 rtl:rotate-180" })}<span>返回</span>` })}</div>`}${renderScript($$result, "/Users/dumengjie/code/astro-paper/src/components/BackButton.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/dumengjie/code/astro-paper/src/components/BackButton.astro", void 0);

const IconChevronRight = createSvgComponent({"meta":{"src":"/_astro/IconChevronRight.Cp8tvvdg.svg","width":24,"height":24,"format":"svg"},"attributes":{"width":"24","height":"24","viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":"2","stroke-linecap":"round","stroke-linejoin":"round","class":"icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"},"children":"<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\" /><path d=\"M9 6l6 6l-6 6\" />"});

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro$1 = createAstro("https://blog.doooit.me/");
const $$PostDetails = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$PostDetails;
  const { post, posts } = Astro2.props;
  const {
    title,
    author,
    description,
    ogImage: initOgImage,
    canonicalURL,
    pubDatetime,
    modDatetime,
    timezone,
    tags,
    hideEditPost
  } = post.data;
  const { Content } = await renderEntry(post);
  let ogImageUrl;
  if (typeof initOgImage === "string") {
    ogImageUrl = initOgImage;
  } else if (initOgImage?.src) {
    ogImageUrl = initOgImage.src;
  }
  const ogImage = ogImageUrl ? new URL(ogImageUrl, Astro2.url.origin).href : void 0;
  const layoutProps = {
    title: `${title} | ${SITE.title}`,
    author,
    description,
    pubDatetime,
    modDatetime,
    canonicalURL,
    ogImage,
    scrollSmooth: true
  };
  const allPosts = posts.map(({ data: { title: title2 }, id, filePath }) => ({
    id,
    title: title2,
    filePath
  }));
  const currentPostIndex = allPosts.findIndex((a) => a.id === post.id);
  const prevPost = currentPostIndex !== 0 ? allPosts[currentPostIndex - 1] : null;
  const nextPost = currentPostIndex !== allPosts.length ? allPosts[currentPostIndex + 1] : null;
  return renderTemplate(_a || (_a = __template(["", ' <script data-astro-rerun>\n  /** Create a progress indicator\n   *  at the top */\n  // function createProgressBar() {\n  //   // Create the main container div\n  //   const progressContainer = document.createElement("div");\n  //   progressContainer.className =\n  //     "progress-container fixed top-0 z-10 h-1 w-full bg-background";\n\n  //   // Create the progress bar div\n  //   const progressBar = document.createElement("div");\n  //   progressBar.className = "progress-bar h-1 w-0 bg-accent";\n  //   progressBar.id = "myBar";\n\n  //   // Append the progress bar to the progress container\n  //   progressContainer.appendChild(progressBar);\n\n  //   // Append the progress container to the document body or any other desired parent element\n  //   document.body.appendChild(progressContainer);\n  // }\n  // createProgressBar();\n\n  /** Update the progress bar\n   *  when user scrolls */\n  // function updateScrollProgress() {\n  //   document.addEventListener("scroll", () => {\n  //     const winScroll =\n  //       document.body.scrollTop || document.documentElement.scrollTop;\n  //     const height =\n  //       document.documentElement.scrollHeight -\n  //       document.documentElement.clientHeight;\n  //     const scrolled = (winScroll / height) * 100;\n  //     if (document) {\n  //       const myBar = document.getElementById("myBar");\n  //       if (myBar) {\n  //         myBar.style.width = scrolled + "%";\n  //       }\n  //     }\n  //   });\n  // }\n  // updateScrollProgress();\n\n  /** Attaches links to headings in the document,\n   *  allowing sharing of sections easily */\n  function addHeadingLinks() {\n    const headings = Array.from(\n      document.querySelectorAll("h2, h3, h4, h5, h6")\n    );\n    for (const heading of headings) {\n      heading.classList.add("group");\n      const link = document.createElement("a");\n      link.className =\n        "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";\n      link.href = "#" + heading.id;\n\n      const span = document.createElement("span");\n      span.ariaHidden = "true";\n      span.innerText = "#";\n      link.appendChild(span);\n      heading.appendChild(link);\n    }\n  }\n  addHeadingLinks();\n\n  /** Attaches copy buttons to code blocks in the document,\n   * allowing users to copy code easily. */\n  function attachCopyButtons() {\n    const copyButtonLabel = "Copy";\n    const codeBlocks = Array.from(document.querySelectorAll("pre"));\n\n    for (const codeBlock of codeBlocks) {\n      const wrapper = document.createElement("div");\n      wrapper.style.position = "relative";\n\n      // Check if --file-name-offset custom property exists\n      const computedStyle = getComputedStyle(codeBlock);\n      const hasFileNameOffset =\n        computedStyle.getPropertyValue("--file-name-offset").trim() !== "";\n\n      // Determine the top positioning class\n      const topClass = hasFileNameOffset\n        ? "top-(--file-name-offset)"\n        : "-top-3";\n\n      const copyButton = document.createElement("button");\n      copyButton.className = `copy-code absolute end-3 ${topClass} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;\n      copyButton.innerHTML = copyButtonLabel;\n      codeBlock.setAttribute("tabindex", "0");\n      codeBlock.appendChild(copyButton);\n\n      // wrap codebock with relative parent element\n      codeBlock?.parentNode?.insertBefore(wrapper, codeBlock);\n      wrapper.appendChild(codeBlock);\n\n      copyButton.addEventListener("click", async () => {\n        await copyCode(codeBlock, copyButton);\n      });\n    }\n\n    async function copyCode(block, button) {\n      const code = block.querySelector("code");\n      const text = code?.innerText;\n\n      await navigator.clipboard.writeText(text ?? "");\n\n      // visual feedback that task is completed\n      button.innerText = "Copied";\n\n      setTimeout(() => {\n        button.innerText = copyButtonLabel;\n      }, 700);\n    }\n  }\n  attachCopyButtons();\n\n  /* Go to page start after page swap */\n  document.addEventListener("astro:after-swap", () =>\n    window.scrollTo({ left: 0, top: 0, behavior: "instant" })\n  );\n<\/script>'], ["", ' <script data-astro-rerun>\n  /** Create a progress indicator\n   *  at the top */\n  // function createProgressBar() {\n  //   // Create the main container div\n  //   const progressContainer = document.createElement("div");\n  //   progressContainer.className =\n  //     "progress-container fixed top-0 z-10 h-1 w-full bg-background";\n\n  //   // Create the progress bar div\n  //   const progressBar = document.createElement("div");\n  //   progressBar.className = "progress-bar h-1 w-0 bg-accent";\n  //   progressBar.id = "myBar";\n\n  //   // Append the progress bar to the progress container\n  //   progressContainer.appendChild(progressBar);\n\n  //   // Append the progress container to the document body or any other desired parent element\n  //   document.body.appendChild(progressContainer);\n  // }\n  // createProgressBar();\n\n  /** Update the progress bar\n   *  when user scrolls */\n  // function updateScrollProgress() {\n  //   document.addEventListener("scroll", () => {\n  //     const winScroll =\n  //       document.body.scrollTop || document.documentElement.scrollTop;\n  //     const height =\n  //       document.documentElement.scrollHeight -\n  //       document.documentElement.clientHeight;\n  //     const scrolled = (winScroll / height) * 100;\n  //     if (document) {\n  //       const myBar = document.getElementById("myBar");\n  //       if (myBar) {\n  //         myBar.style.width = scrolled + "%";\n  //       }\n  //     }\n  //   });\n  // }\n  // updateScrollProgress();\n\n  /** Attaches links to headings in the document,\n   *  allowing sharing of sections easily */\n  function addHeadingLinks() {\n    const headings = Array.from(\n      document.querySelectorAll("h2, h3, h4, h5, h6")\n    );\n    for (const heading of headings) {\n      heading.classList.add("group");\n      const link = document.createElement("a");\n      link.className =\n        "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";\n      link.href = "#" + heading.id;\n\n      const span = document.createElement("span");\n      span.ariaHidden = "true";\n      span.innerText = "#";\n      link.appendChild(span);\n      heading.appendChild(link);\n    }\n  }\n  addHeadingLinks();\n\n  /** Attaches copy buttons to code blocks in the document,\n   * allowing users to copy code easily. */\n  function attachCopyButtons() {\n    const copyButtonLabel = "Copy";\n    const codeBlocks = Array.from(document.querySelectorAll("pre"));\n\n    for (const codeBlock of codeBlocks) {\n      const wrapper = document.createElement("div");\n      wrapper.style.position = "relative";\n\n      // Check if --file-name-offset custom property exists\n      const computedStyle = getComputedStyle(codeBlock);\n      const hasFileNameOffset =\n        computedStyle.getPropertyValue("--file-name-offset").trim() !== "";\n\n      // Determine the top positioning class\n      const topClass = hasFileNameOffset\n        ? "top-(--file-name-offset)"\n        : "-top-3";\n\n      const copyButton = document.createElement("button");\n      copyButton.className = \\`copy-code absolute end-3 \\${topClass} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium\\`;\n      copyButton.innerHTML = copyButtonLabel;\n      codeBlock.setAttribute("tabindex", "0");\n      codeBlock.appendChild(copyButton);\n\n      // wrap codebock with relative parent element\n      codeBlock?.parentNode?.insertBefore(wrapper, codeBlock);\n      wrapper.appendChild(codeBlock);\n\n      copyButton.addEventListener("click", async () => {\n        await copyCode(codeBlock, copyButton);\n      });\n    }\n\n    async function copyCode(block, button) {\n      const code = block.querySelector("code");\n      const text = code?.innerText;\n\n      await navigator.clipboard.writeText(text ?? "");\n\n      // visual feedback that task is completed\n      button.innerText = "Copied";\n\n      setTimeout(() => {\n        button.innerText = copyButtonLabel;\n      }, 700);\n    }\n  }\n  attachCopyButtons();\n\n  /* Go to page start after page swap */\n  document.addEventListener("astro:after-swap", () =>\n    window.scrollTo({ left: 0, top: 0, behavior: "instant" })\n  );\n<\/script>'])), renderComponent($$result, "Layout", $$Layout, { ...layoutProps }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "BackButton", $$BackButton, {})} ${maybeRenderHead()}<main id="main-content"${addAttribute([
    "mx-auto w-full max-w-app px-4 pb-12",
    { "mt-8": false }
  ], "class:list")} data-pagefind-body> <h1 class="inline-block text-2xl font-bold text-accent sm:text-3xl"${addAttribute(renderTransition($$result2, "fam6wyqg", "", slugifyStr(title)), "data-astro-transition-scope")}> ${title} </h1> <div class="my-2 flex items-center gap-2"> ${renderComponent($$result2, "Datetime", $$Datetime, { "pubDatetime": pubDatetime, "modDatetime": modDatetime, "timezone": timezone, "size": "lg" })} <span aria-hidden="true"${addAttribute([
    "max-sm:hidden",
    { hidden: true }
  ], "class:list")}>|</span> ${renderComponent($$result2, "EditPost", $$EditPost, { "hideEditPost": hideEditPost, "post": post, "class": "max-sm:hidden" })} </div> <article id="article" class="app-prose mx-auto mt-8 max-w-app prose-pre:bg-(--shiki-light-bg) dark:prose-pre:bg-(--shiki-dark-bg)"> ${renderComponent($$result2, "Content", Content, {})} </article> <!-- <hr class="my-8 border-dashed" /> --> <!-- <EditPost class="sm:hidden" {hideEditPost} {post} /> --> <hr class="my-6 border-dashed"> <ul class="mt-4 mb-8 sm:my-8"> ${tags.map((tag) => renderTemplate`${renderComponent($$result2, "Tag", $$Tag, { "tag": slugifyStr(tag), "tagName": tag })}`)} </ul> <!-- <BackToTopButton /> --> <!-- <ShareLinks /> --> <!-- Previous/Next Post Buttons --> <div data-pagefind-ignore class="grid grid-cols-1 gap-6 sm:grid-cols-2"> ${prevPost && renderTemplate`<a${addAttribute(getPath(prevPost.id, prevPost.filePath), "href")} class="flex items-center w-full gap-1 hover:opacity-75"> ${renderComponent($$result2, "IconChevronLeft", IconChevronLeft, { "class": "inline-block flex-none rtl:rotate-180" })} <div class="text-sm text-accent/85">${prevPost.title}</div> </a>`} ${nextPost && renderTemplate`<a${addAttribute(getPath(nextPost.id, nextPost.filePath), "href")} class="flex items-center w-full justify-end gap-1 text-end hover:opacity-75 sm:col-start-2"> <div class="text-sm text-accent/85">${nextPost.title}</div> ${renderComponent($$result2, "IconChevronRight", IconChevronRight, { "class": "inline-block flex-none rtl:rotate-180" })} </a>`} </div> <hr class="my-6 border-dashed"> ${renderComponent($$result2, "Comments", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "@/components/Comments", "client:component-export": "default" })} </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` }));
}, "/Users/dumengjie/code/astro-paper/src/layouts/PostDetails.astro", "self");

const $$Astro = createAstro("https://blog.doooit.me/");
async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const postResult = posts.map((post) => ({
    params: { slug: getPath(post.id, post.filePath, false) },
    props: { post }
  }));
  return postResult;
}
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const { post } = Astro2.props;
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  return renderTemplate`${renderComponent($$result, "PostDetails", $$PostDetails, { "post": post, "posts": sortedPosts })}`;
}, "/Users/dumengjie/code/astro-paper/src/pages/posts/[...slug]/index.astro", void 0);

const $$file = "/Users/dumengjie/code/astro-paper/src/pages/posts/[...slug]/index.astro";
const $$url = "/posts/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
