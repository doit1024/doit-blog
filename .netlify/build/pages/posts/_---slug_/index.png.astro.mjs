import '../../../chunks/_astro_content_DO-0ymuU.mjs';
import '../../../chunks/content.config_Lj1yXH8X.mjs';
import 'lodash.kebabcase';
import '@resvg/resvg-js';
import 'satori';
export { renderers } from '../../../renderers.mjs';

async function getStaticPaths() {
  {
    return [];
  }
}
const GET = async ({ props }) => {
  {
    return new Response(null, {
      status: 404,
      statusText: "Not found"
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  getStaticPaths
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
