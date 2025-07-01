import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.ts", "**/*.tsx"], // Apply these rules to TypeScript and TSX files
    rules: {
      // Disable the 'no-explicit-any' rule
      "@typescript-eslint/no-explicit-any": "off",
      // Disable the 'no-unused-vars' rule
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.tsx"], // Apply this rule specifically to TSX files (React components)
    rules: {
      // Disable the 'no-html-link-for-pages' rule for Next.js
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
