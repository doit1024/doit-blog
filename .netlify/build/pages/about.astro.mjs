import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, d as renderSlot, u as unescapeHTML } from '../chunks/astro/server_BhNfQlrz.mjs';
import 'kleur/colors';
import { $ as $$Layout, a as $$Header, c as $$Footer } from '../chunks/Footer_DyXL4eSp.mjs';
import { $ as $$Breadcrumb } from '../chunks/Breadcrumb_DpVJfhXJ.mjs';
import { S as SITE } from '../chunks/config_Bu0bSZwp.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://blog.doooit.me/");
const $$AboutLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AboutLayout;
  const { frontmatter } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${frontmatter.title} | ${SITE.title}` }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Header", $$Header, {})} ${renderComponent($$result2, "Breadcrumb", $$Breadcrumb, {})} ${maybeRenderHead()}<main id="main-content" class="max-w-app mx-auto w-full px-4 pb-12"> <section id="about" class="app-prose m-0 p-0 prose-img:border-0"> <h1 class="text-2xl tracking-wider sm:text-3xl">${frontmatter.title}</h1> ${renderSlot($$result2, $$slots["default"])} </section> <hr class="my-6 border-dashed"> ${renderComponent($$result2, "Comments", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "@/components/Comments", "client:component-export": "default" })} </main> ${renderComponent($$result2, "Footer", $$Footer, {})} ` })}`;
}, "/Users/dumengjie/code/astro-paper/src/layouts/AboutLayout.astro", void 0);

const html = () => "<p>嗨👋，</p>\n<p>我是<strong>doit</strong>，也是<strong>杜伊特</strong>，一名爱折腾的前端开发工程师🧑‍💻。</p>\n<p>在这里，我会分享自己生活日常和技术探索，记录所思、所见、所想。</p>\n<h3 id=\"what-im-doing\">what i’m doing</h3>\n<ul>\n<li>搬砖</li>\n<li>学习全栈开发</li>\n<li>写博客</li>\n<li>持续完善博客功能</li>\n</ul>\n<h3 id=\"what-i-like\">what i like</h3>\n<ul>\n<li>足球⚽️</li>\n<li>音乐🎸</li>\n<li>摄影📷</li>\n</ul>\n<h3 id=\"联系我\">联系我</h3>\n<ul>\n<li>邮箱：<a href=\"mailto:doit10241024@gmail.com\">doit10241024@gmail.com</a></li>\n<li>Github：<a href=\"https://github.com/doit1024\">https://github.com/doit1024</a></li>\n</ul>\n<h2 id=\"关于本博客\">关于本博客</h2>\n<ul>\n<li>地址：<a href=\"https://blog.doooit.me\">https://blog.doooit.me</a></li>\n<li>框架：<a href=\"https://astro.build\">Astro</a></li>\n<li>主题：<a href=\"https://github.com/satnaing/astro-paper\">astro-paper</a></li>\n<li>代码仓库：<a href=\"https://github.com/doit1024/doit-blog\">doit-blog</a></li>\n<li>评论系统：<a href=\"https://giscus.app\">giscus</a></li>\n<li>域名 &#x26; DNS: <a href=\"https://www.cloudflare.com/\">Cloudflare</a></li>\n<li>部署 &#x26; 托管: <a href=\"https://www.cloudflare.com/products/pages/\">Cloudflare Pages</a></li>\n<li>图床: <a href=\"https://www.cloudflare.com/products/r2/\">Cloudflare R2</a> + <a href=\"https://webp.cloud/\">WebP Cloud</a></li>\n</ul>";

				const frontmatter = {"layout":"../layouts/AboutLayout.astro","title":"关于我"};
				const file = "/Users/dumengjie/code/astro-paper/src/pages/about.md";
				const url = "/about";
				function rawContent() {
					return "   \n                                    \n            \n   \n\n嗨👋，\n\n我是**doit**，也是**杜伊特**，一名爱折腾的前端开发工程师🧑‍💻。\n\n在这里，我会分享自己生活日常和技术探索，记录所思、所见、所想。\n\n### what i'm doing\n\n- 搬砖\n- 学习全栈开发\n- 写博客\n- 持续完善博客功能\n\n### what i like\n\n- 足球⚽️\n- 音乐🎸\n- 摄影📷\n\n### 联系我\n\n- 邮箱：doit10241024@gmail.com\n- Github：https://github.com/doit1024\n\n## 关于本博客\n\n- 地址：https://blog.doooit.me\n- 框架：[Astro](https://astro.build)\n- 主题：[astro-paper](https://github.com/satnaing/astro-paper)\n- 代码仓库：[doit-blog](https://github.com/doit1024/doit-blog)\n- 评论系统：[giscus](https://giscus.app)\n- 域名 & DNS: [Cloudflare](https://www.cloudflare.com/)\n- 部署 & 托管: [Cloudflare Pages](https://www.cloudflare.com/products/pages/)\n- 图床: [Cloudflare R2](https://www.cloudflare.com/products/r2/) + [WebP Cloud](https://webp.cloud/)\n";
				}
				async function compiledContent() {
					return await html();
				}
				function getHeadings() {
					return [{"depth":3,"slug":"what-im-doing","text":"what i’m doing"},{"depth":3,"slug":"what-i-like","text":"what i like"},{"depth":3,"slug":"联系我","text":"联系我"},{"depth":2,"slug":"关于本博客","text":"关于本博客"}];
				}

				const Content = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;

					return renderTemplate`${renderComponent(result, 'Layout', $$AboutLayout, {
								file,
								url,
								content,
								frontmatter: content,
								headings: getHeadings(),
								rawContent,
								compiledContent,
								'server:root': true,
							}, {
								'default': () => renderTemplate`${unescapeHTML(html())}`
							})}`;
				});

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  Content,
  compiledContent,
  default: Content,
  file,
  frontmatter,
  getHeadings,
  rawContent,
  url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
