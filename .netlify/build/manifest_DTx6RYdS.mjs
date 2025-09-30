import '@astrojs/internal-helpers/path';
import 'kleur/colors';
import { N as NOOP_MIDDLEWARE_HEADER, o as decodeKey } from './chunks/astro/server_BhNfQlrz.mjs';
import 'clsx';
import 'cookie';
import 'es-module-lexer';
import 'html-escaper';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/dumengjie/code/astro-paper/","cacheDir":"file:///Users/dumengjie/code/astro-paper/node_modules/.astro/","outDir":"file:///Users/dumengjie/code/astro-paper/dist/","srcDir":"file:///Users/dumengjie/code/astro-paper/src/","publicDir":"file:///Users/dumengjie/code/astro-paper/public/","buildClientDir":"file:///Users/dumengjie/code/astro-paper/dist/","buildServerDir":"file:///Users/dumengjie/code/astro-paper/.netlify/build/","adapterName":"@astrojs/netlify","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"about/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.md","pathname":"/about","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"archives/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/archives","isIndex":true,"type":"page","pattern":"^\\/archives\\/?$","segments":[[{"content":"archives","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/archives/index.astro","pathname":"/archives","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"bb/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/bb","isIndex":false,"type":"page","pattern":"^\\/bb\\/?$","segments":[[{"content":"bb","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/bb.astro","pathname":"/bb","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"og.png","links":[],"scripts":[],"styles":[],"routeData":{"route":"/og.png","isIndex":false,"type":"endpoint","pattern":"^\\/og\\.png\\/?$","segments":[[{"content":"og.png","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/og.png.ts","pathname":"/og.png","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"robots.txt","links":[],"scripts":[],"styles":[],"routeData":{"route":"/robots.txt","isIndex":false,"type":"endpoint","pattern":"^\\/robots\\.txt\\/?$","segments":[[{"content":"robots.txt","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/robots.txt.ts","pathname":"/robots.txt","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"rss.xml","links":[],"scripts":[],"styles":[],"routeData":{"route":"/rss.xml","isIndex":false,"type":"endpoint","pattern":"^\\/rss\\.xml\\/?$","segments":[[{"content":"rss.xml","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/rss.xml.ts","pathname":"/rss.xml","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"search/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/search","isIndex":false,"type":"page","pattern":"^\\/search\\/?$","segments":[[{"content":"search","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/search.astro","pathname":"/search","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"tags/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/tags","isIndex":true,"type":"page","pattern":"^\\/tags\\/?$","segments":[[{"content":"tags","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/tags/index.astro","pathname":"/tags","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"inline","content":":where([data-astro-image]){object-fit:var(--fit);object-position:var(--pos);height:auto}:where([data-astro-image=full-width]){width:100%}:where([data-astro-image=constrained]){max-width:100%}\n"}],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/.pnpm/astro@5.13.5_@netlify+blobs@10.0.11_@types+node@24.3.1_jiti@2.5.1_lightningcss@1.30.1_r_c2dad8262b51940913fea5ac7506aa1e/node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/about.BaX2Dkhp.css"}],"routeData":{"route":"/404","isIndex":false,"type":"page","pattern":"^\\/404\\/?$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"site":"https://blog.doooit.me/","base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/dumengjie/code/astro-paper/src/layouts/PostDetails.astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/posts/[...slug]/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/posts/[...slug]/index@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/search.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/search@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/tags/[tag]/[...page].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/tags/[tag]/[...page]@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/components/Tag.astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/tags/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/tags/index@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/layouts/Main.astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/archives/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/archives/index@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/bb.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/bb@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/posts/[...page].astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/posts/[...page]@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/content.config.ts",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/utils/getPath.ts",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/components/Card.astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000@astro-page:src/pages/index@_@astro",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/posts/[...slug]/index.png.ts",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/posts/[...slug]/index.png@_@ts",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/rss.xml.ts",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/rss.xml@_@ts",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/utils/generateOgImages.ts",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/og.png.ts",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/og.png@_@ts",{"propagation":"in-tree","containsHead":false}],["/Users/dumengjie/code/astro-paper/src/pages/about.md",{"propagation":"none","containsHead":true}],["/Users/dumengjie/code/astro-paper/src/pages/404.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:node_modules/.pnpm/astro@5.13.5_@netlify+blobs@10.0.11_@types+node@24.3.1_jiti@2.5.1_lightningcss@1.30.1_r_c2dad8262b51940913fea5ac7506aa1e/node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/404@_@astro":"pages/404.astro.mjs","\u0000@astro-page:src/pages/about@_@md":"pages/about.astro.mjs","\u0000@astro-page:src/pages/archives/index@_@astro":"pages/archives.astro.mjs","\u0000@astro-page:src/pages/bb@_@astro":"pages/bb.astro.mjs","\u0000@astro-page:src/pages/og.png@_@ts":"pages/og.png.astro.mjs","\u0000@astro-page:src/pages/posts/[...slug]/index.png@_@ts":"pages/posts/_---slug_/index.png.astro.mjs","\u0000@astro-page:src/pages/posts/[...page]@_@astro":"pages/posts/_---page_.astro.mjs","\u0000@astro-page:src/pages/posts/[...slug]/index@_@astro":"pages/posts/_---slug_.astro.mjs","\u0000@astro-page:src/pages/robots.txt@_@ts":"pages/robots.txt.astro.mjs","\u0000@astro-page:src/pages/rss.xml@_@ts":"pages/rss.xml.astro.mjs","\u0000@astro-page:src/pages/search@_@astro":"pages/search.astro.mjs","\u0000@astro-page:src/pages/tags/[tag]/[...page]@_@astro":"pages/tags/_tag_/_---page_.astro.mjs","\u0000@astro-page:src/pages/tags/index@_@astro":"pages/tags.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_DTx6RYdS.mjs","/Users/dumengjie/code/astro-paper/node_modules/.pnpm/unstorage@1.17.1_@netlify+blobs@10.0.11/node_modules/unstorage/drivers/netlify-blobs.mjs":"chunks/netlify-blobs_CmJfU_Nd.mjs","/Users/dumengjie/code/astro-paper/.astro/content-assets.mjs":"chunks/content-assets_DleWbedO.mjs","/Users/dumengjie/code/astro-paper/.astro/content-modules.mjs":"chunks/content-modules_DPvx6ny7.mjs","\u0000astro:data-layer-content":"chunks/_astro_data-layer-content_CbU3zPt1.mjs","/Users/dumengjie/code/astro-paper/src/data/blog/wakayama-travel.mdx?astroPropagatedAssets":"chunks/wakayama-travel_DakDZ9uN.mjs","/Users/dumengjie/code/astro-paper/src/data/blog/wakayama-travel.mdx":"chunks/wakayama-travel_eE2DojsO.mjs","\u0000astro:assets":"chunks/_astro_assets_D9pPgi1P.mjs","@/components/Comments":"_astro/Comments.C41M0xAk.js","@astrojs/react/client.js":"_astro/client.DVxemvf8.js","/Users/dumengjie/code/astro-paper/src/pages/search.astro?astro&type=script&index=0&lang.ts":"_astro/search.astro_astro_type_script_index_0_lang.BwQm-6IO.js","/Users/dumengjie/code/astro-paper/src/pages/index.astro?astro&type=script&index=0&lang.ts":"_astro/index.astro_astro_type_script_index_0_lang.CMNmTAiG.js","/Users/dumengjie/code/astro-paper/src/components/Header.astro?astro&type=script&index=0&lang.ts":"_astro/Header.astro_astro_type_script_index_0_lang.Mdz3KX3V.js","/Users/dumengjie/code/astro-paper/src/layouts/Main.astro?astro&type=script&index=0&lang.ts":"_astro/Main.astro_astro_type_script_index_0_lang.DmwrTf24.js","/Users/dumengjie/code/astro-paper/node_modules/.pnpm/astro@5.13.5_@netlify+blobs@10.0.11_@types+node@24.3.1_jiti@2.5.1_lightningcss@1.30.1_r_c2dad8262b51940913fea5ac7506aa1e/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts":"_astro/ClientRouter.astro_astro_type_script_index_0_lang.DZnDNxNb.js","/Users/dumengjie/code/astro-paper/src/components/BackButton.astro?astro&type=script&index=0&lang.ts":"_astro/BackButton.astro_astro_type_script_index_0_lang.CWLqCqN9.js","/Users/dumengjie/code/astro-paper/node_modules/.pnpm/@giscus+react@3.1.0_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/@giscus/react/dist/giscus-Ci9LqPcC.js":"_astro/giscus-Ci9LqPcC.cvwcBf5t.js","/Users/dumengjie/code/astro-paper/node_modules/.pnpm/@pagefind+default-ui@1.4.0/node_modules/@pagefind/default-ui/npm_dist/mjs/ui-core.mjs":"_astro/ui-core.5vfW5kUq.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["/Users/dumengjie/code/astro-paper/src/pages/index.astro?astro&type=script&index=0&lang.ts","document.addEventListener(\"astro:page-load\",()=>{document.querySelector(\"#main-content\")?.dataset?.layout&&sessionStorage.setItem(\"backUrl\",\"/\")});"],["/Users/dumengjie/code/astro-paper/src/components/Header.astro?astro&type=script&index=0&lang.ts","function s(){const e=document.querySelector(\"#menu-btn\"),t=document.querySelector(\"#menu-items\"),n=document.querySelector(\"#menu-icon\"),o=document.querySelector(\"#close-icon\");!e||!t||!n||!o||e.addEventListener(\"click\",()=>{const c=e.getAttribute(\"aria-expanded\")===\"true\";e.setAttribute(\"aria-expanded\",c?\"false\":\"true\"),e.setAttribute(\"aria-label\",c?\"Open Menu\":\"Close Menu\"),t.classList.toggle(\"hidden\"),n.classList.toggle(\"hidden\"),o.classList.toggle(\"hidden\")})}s();document.addEventListener(\"astro:after-swap\",s);"],["/Users/dumengjie/code/astro-paper/src/layouts/Main.astro?astro&type=script&index=0&lang.ts","document.addEventListener(\"astro:page-load\",()=>{const t=document.querySelector(\"#main-content\")?.dataset?.backurl;t&&sessionStorage.setItem(\"backUrl\",t)});"],["/Users/dumengjie/code/astro-paper/src/components/BackButton.astro?astro&type=script&index=0&lang.ts","function o(){const t=document.querySelector(\"#back-button\"),e=sessionStorage.getItem(\"backUrl\");e&&t&&(t.href=e)}document.addEventListener(\"astro:page-load\",o);o();"]],"assets":["/_astro/cute_bear.DXRCBOhu.png","/_astro/IconArrowRight.D72qTBYn.svg","/_astro/IconX.DK0Dc7zq.svg","/_astro/IconSunHigh.EHu4P2Sl.svg","/_astro/IconArchive.Woxh8eou.svg","/_astro/IconMenuDeep.CczWFiGg.svg","/_astro/IconMoon.CRxdR147.svg","/_astro/IconSearch.w3diR66o.svg","/_astro/IconArrowLeft.7rKuNJsZ.svg","/_astro/IconMail.BsR8RxJL.svg","/_astro/IconRss.BYWRoVjV.svg","/_astro/IconGitHub.D4TpU-sh.svg","/_astro/IconChevronLeft.DuweWiRq.svg","/_astro/IconChevronRight.Cp8tvvdg.svg","/_astro/IconEdit.C9zdzJLB.svg","/_astro/about.BaX2Dkhp.css","/_astro/bb.CXOjeUv_.css","/_astro/bb.3zzR1xRy.css","/doit-og.png","/favicon.svg","/toggle-theme.js","/_astro/ClientRouter.astro_astro_type_script_index_0_lang.DZnDNxNb.js","/_astro/Comments.C41M0xAk.js","/_astro/client.DVxemvf8.js","/_astro/giscus-Ci9LqPcC.cvwcBf5t.js","/_astro/index.RH_Wq4ov.js","/_astro/preload-helper.BlTxHScW.js","/_astro/search.astro_astro_type_script_index_0_lang.BwQm-6IO.js","/_astro/ui-core.5vfW5kUq.js","/pagefind/pagefind-entry.json","/pagefind/pagefind-highlight.js","/pagefind/pagefind-modular-ui.css","/pagefind/pagefind-modular-ui.js","/pagefind/pagefind-ui.css","/pagefind/pagefind-ui.js","/pagefind/pagefind.js","/pagefind/pagefind.zh-cn_34e93eb15bfcc.pf_meta","/pagefind/pagefind.zh-cn_66f3a9b28ba0e.pf_meta","/pagefind/pagefind.zh-cn_7e4e25de2817f.pf_meta","/pagefind/pagefind.zh-cn_9e5115f786908.pf_meta","/pagefind/pagefind.zh-cn_e01c2244aecee.pf_meta","/pagefind/pagefind.zh-cn_eef788f32d2cf.pf_meta","/pagefind/wasm.unknown.pagefind","/assets/forrest-gump-quote.webp","/pagefind/fragment/zh-cn_1223b7b.pf_fragment","/pagefind/fragment/zh-cn_1275292.pf_fragment","/pagefind/fragment/zh-cn_15c1357.pf_fragment","/pagefind/fragment/zh-cn_1c7f392.pf_fragment","/pagefind/fragment/zh-cn_1d1af47.pf_fragment","/pagefind/fragment/zh-cn_2617d27.pf_fragment","/pagefind/fragment/zh-cn_30c387f.pf_fragment","/pagefind/fragment/zh-cn_32276e1.pf_fragment","/pagefind/fragment/zh-cn_337023b.pf_fragment","/pagefind/fragment/zh-cn_33a2d03.pf_fragment","/pagefind/fragment/zh-cn_3653d5e.pf_fragment","/pagefind/fragment/zh-cn_407ffa5.pf_fragment","/pagefind/fragment/zh-cn_539410d.pf_fragment","/pagefind/fragment/zh-cn_5542c89.pf_fragment","/pagefind/fragment/zh-cn_584cde2.pf_fragment","/pagefind/fragment/zh-cn_734585c.pf_fragment","/pagefind/fragment/zh-cn_7660df3.pf_fragment","/pagefind/fragment/zh-cn_7d4449f.pf_fragment","/pagefind/fragment/zh-cn_801970f.pf_fragment","/pagefind/fragment/zh-cn_807bc3b.pf_fragment","/pagefind/fragment/zh-cn_8396af1.pf_fragment","/pagefind/fragment/zh-cn_8c2a366.pf_fragment","/pagefind/fragment/zh-cn_9f6cba8.pf_fragment","/pagefind/fragment/zh-cn_9fc2432.pf_fragment","/pagefind/fragment/zh-cn_a160242.pf_fragment","/pagefind/fragment/zh-cn_a42eb91.pf_fragment","/pagefind/fragment/zh-cn_be77f2a.pf_fragment","/pagefind/fragment/zh-cn_be8d3ca.pf_fragment","/pagefind/fragment/zh-cn_c46b7c9.pf_fragment","/pagefind/fragment/zh-cn_c5e0cd2.pf_fragment","/pagefind/fragment/zh-cn_d2e3066.pf_fragment","/pagefind/fragment/zh-cn_d58a641.pf_fragment","/pagefind/fragment/zh-cn_da44d15.pf_fragment","/pagefind/fragment/zh-cn_dc652e6.pf_fragment","/pagefind/fragment/zh-cn_e07cfcb.pf_fragment","/pagefind/fragment/zh-cn_e28be42.pf_fragment","/pagefind/fragment/zh-cn_ed4041f.pf_fragment","/pagefind/fragment/zh-cn_f55c5ac.pf_fragment","/pagefind/index/zh-cn_3727f59.pf_index","/pagefind/index/zh-cn_59a490a.pf_index","/pagefind/index/zh-cn_79b9d51.pf_index","/pagefind/index/zh-cn_7e8c816.pf_index","/pagefind/index/zh-cn_aa28fa5.pf_index","/pagefind/index/zh-cn_ddee68e.pf_index","/pagefind/index/zh-cn_f5a5dd1.pf_index","/pagefind/index/zh-cn_fee85fc.pf_index","/about/index.html","/archives/index.html","/bb/index.html","/og.png","/robots.txt","/rss.xml","/search/index.html","/tags/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"d25jnBKbgL70axgeOufY9ak/t8X17agZe2PkSakYRO4=","sessionConfig":{"driver":"netlify-blobs","options":{"name":"astro-sessions","consistency":"strong"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/netlify-blobs_CmJfU_Nd.mjs');

export { manifest };
