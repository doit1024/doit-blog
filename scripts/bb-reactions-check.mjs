import { register } from "node:module";

register(new URL("./bb-reactions-loader.mjs", import.meta.url), import.meta.url);

const mod = await import("../src/utils/bb-reactions.test.ts");
if (typeof mod.run !== "function") {
  throw new Error("bb-reactions.test.ts did not export run()");
}
await mod.run();
process.stdout.write("bb reactions checks passed\n");
