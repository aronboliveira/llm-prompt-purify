import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      ".tmp/**",
      "**/*.d.ts",
      "*.config.js",
      "*.config.mjs",
    ],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      // Core ESLint rules - lax mode
      "no-console": "off",
      "no-debugger": "warn",
      "no-unused-vars": "off",
      "no-undef": "off",
      "prefer-const": "warn",

      // TypeScript rules - lax mode
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // Code style - minimal enforcement
      "eqeqeq": ["warn", "smart"],
      "curly": "off",
      "semi": "off",
      "quotes": "off",
      "comma-dangle": "off",
      "indent": "off",
      "max-len": "off",
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      // Even more relaxed for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];
