// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**", "spikes/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Browser + Chrome globals for the extension source.
  {
    files: ["apps/extension/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, chrome: "readonly" },
    },
  },
  // D015: no chrome.* access outside the platform adapter (packages/extension
  // feature code must go through the adapter so the port + e2e-mock seam holds).
  {
    files: ["apps/extension/src/**/*.{ts,tsx}"],
    ignores: ["apps/extension/src/platform/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='chrome']",
          message:
            "No chrome.* outside the platform adapter (D015). Import from src/platform instead.",
        },
      ],
    },
  },
);
