import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";

export default defineConfig([
  {
    ignores: [
      ".react-router/**",
      "convex/_generated/**",
      "build/**",
      "dist/**",
      "node_modules/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  ...tseslint.configs.recommended,
  reactYouMightNotNeedAnEffect.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    settings: {
      react: {
        version: "19.1.1",
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off", // React 19+ automatic JSX runtime
      "react/jsx-uses-react": "off", // React 19+ automatic JSX runtime
      "no-empty-pattern": "off", // Allow empty destructuring in function params
      "@typescript-eslint/no-empty-object-type": "off", // Allow {} type in React Router
      "@typescript-eslint/no-namespace": "off", // Allow namespaces in generated types
    },
  },
]);