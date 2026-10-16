import { readFileSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("..", import.meta.url));

function isTsSpecifier(specifier) {
  return (
    specifier.startsWith("@/") ||
    specifier.endsWith(".ts") ||
    specifier.startsWith("./") ||
    specifier.startsWith("../")
  );
}

export async function resolve(specifier, context, nextResolve) {
  if (!isTsSpecifier(specifier)) return nextResolve(specifier, context);

  let filename;
  if (specifier.startsWith("@/")) {
    filename = join(root, "src", specifier.slice(2));
  } else if (context.parentURL) {
    filename = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
  } else {
    return nextResolve(specifier, context);
  }
  if (!filename.endsWith(".ts")) filename += ".ts";
  return { url: pathToFileURL(filename).href, shortCircuit: true };
}

export async function load(url, context, nextLoad) {
  if (!url.endsWith(".ts")) return nextLoad(url, context);
  const source = readFileSync(fileURLToPath(url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}
