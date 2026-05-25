import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      ".vercel/**",
      "References/**",
      "public/audio/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      // Don't require explicit prop types — TS already enforces them
      "react/prop-types": "off",
      // Apostrophes in kid-facing dialogue render fine; the rule is mostly
      // noise for marketing-copy projects like this.
      "react/no-unescaped-entities": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
  // Test files: relax some rules
  {
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.{ts,tsx}", "src/test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Platform must not import from any specific lesson — the registry is
  // the one allowed coupling point. Keeping platform code lesson-agnostic
  // is the whole point of the lesson-server pattern.
  {
    files: ["src/platform/**/*.{ts,tsx}"],
    ignores: ["src/platform/registry.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lessons/*", "../lessons/*", "../../lessons/*"],
              message:
                "Platform code must not import from a specific lesson. Use the LessonModule contract and load lessons via the registry.",
            },
          ],
        },
      ],
    },
  },
  // A lesson must not import from another lesson — every lesson is
  // self-contained. Cross-lesson sharing happens via the platform (move
  // the shared bit there, or copy it).
  {
    files: ["src/lessons/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/lessons/acutis/*",
                "@/lessons/asl/*",
                "@/lessons/freddy-fractions/*",
              ],
              message:
                "Lessons must be self-contained. Don't import from another lesson — move shared code into src/platform/ or duplicate it.",
            },
          ],
        },
      ],
    },
  },
  // Always last — disables formatting rules that conflict with Prettier
  prettierConfig,
);
