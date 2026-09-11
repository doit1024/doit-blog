import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // eslint-plugin-astro extracts <script> into virtual files (*.astro/*.ts).
    // Require parameter types so implicit any is caught by `pnpm lint`, not only
    // later by `astro check` (tsconfig strict / noImplicitAny).
    files: ["**/*.astro/*.ts", "*.astro/*.ts"],
    rules: {
      "@typescript-eslint/typedef": [
        "error",
        {
          parameter: true,
          arrowParameter: false,
          variableDeclaration: false,
          memberVariableDeclaration: false,
          propertyDeclaration: false,
          objectDestructuring: false,
          arrayDestructuring: false,
        },
      ],
    },
  },
  { ignores: ["dist/**", ".astro", "public/pagefind/**"] },
];
