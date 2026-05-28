import path from "node:path";

import type { ConfigType } from "./types.js";

// Exact filename → ConfigType (checked first, O(1))
const CONFIG_FILENAMES = new Map<string, ConfigType>([
  // TypeScript
  ["tsconfig.json", "tsconfig"],
  ["tsconfig.base.json", "tsconfig"],
  ["tsconfig.build.json", "tsconfig"],
  ["tsconfig.node.json", "tsconfig"],
  ["tsconfig.app.json", "tsconfig"],
  // ESLint
  [".eslintrc", "eslint"],
  [".eslintrc.js", "eslint"],
  [".eslintrc.cjs", "eslint"],
  [".eslintrc.json", "eslint"],
  [".eslintrc.yaml", "eslint"],
  [".eslintrc.yml", "eslint"],
  ["eslint.config.js", "eslint"],
  ["eslint.config.mjs", "eslint"],
  ["eslint.config.cjs", "eslint"],
  ["eslint.config.ts", "eslint"],
  // Prettier
  [".prettierrc", "prettier"],
  [".prettierrc.js", "prettier"],
  [".prettierrc.cjs", "prettier"],
  [".prettierrc.json", "prettier"],
  [".prettierrc.yaml", "prettier"],
  [".prettierrc.yml", "prettier"],
  ["prettier.config.js", "prettier"],
  ["prettier.config.cjs", "prettier"],
  ["prettier.config.ts", "prettier"],
  // Vite
  ["vite.config.js", "vite"],
  ["vite.config.ts", "vite"],
  ["vite.config.mjs", "vite"],
  ["vite.config.mts", "vite"],
  // Webpack
  ["webpack.config.js", "webpack"],
  ["webpack.config.ts", "webpack"],
  ["webpack.config.mjs", "webpack"],
  ["webpack.config.cjs", "webpack"],
  // Rollup
  ["rollup.config.js", "rollup"],
  ["rollup.config.ts", "rollup"],
  ["rollup.config.mjs", "rollup"],
  // Babel
  ["babel.config.js", "babel"],
  ["babel.config.cjs", "babel"],
  ["babel.config.json", "babel"],
  [".babelrc", "babel"],
  [".babelrc.js", "babel"],
  [".babelrc.json", "babel"],
  // Jest
  ["jest.config.js", "jest"],
  ["jest.config.ts", "jest"],
  ["jest.config.cjs", "jest"],
  ["jest.config.json", "jest"],
  // Vitest
  ["vitest.config.js", "vitest"],
  ["vitest.config.ts", "vitest"],
  ["vitest.config.mts", "vitest"],
  ["vitest.config.mjs", "vitest"],
  // Tailwind
  ["tailwind.config.js", "tailwind"],
  ["tailwind.config.ts", "tailwind"],
  ["tailwind.config.mjs", "tailwind"],
  ["tailwind.config.cjs", "tailwind"],
  // PostCSS
  ["postcss.config.js", "postcss"],
  ["postcss.config.cjs", "postcss"],
  ["postcss.config.mjs", "postcss"],
  // Docker
  ["Dockerfile", "docker"],
  ["docker-compose.yml", "docker"],
  ["docker-compose.yaml", "docker"],
  ["docker-compose.prod.yml", "docker"],
  ["docker-compose.dev.yml", "docker"],
  // Env
  [".env", "env"],
  [".env.local", "env"],
  [".env.example", "env"],
  [".env.sample", "env"],
  [".env.test", "env"],
  [".env.production", "env"],
  [".env.development", "env"],
  // Misc
  [".editorconfig", "editorconfig"],
  [".nvmrc", "nvmrc"],
  [".node-version", "nvmrc"],
  // Lock files
  ["pnpm-lock.yaml", "lockfile"],
  ["package-lock.json", "lockfile"],
  ["yarn.lock", "lockfile"],
  ["bun.lockb", "lockfile"],
  ["shrinkwrap.json", "lockfile"],
]);

// CI config path prefixes (relative path contains these)
const CI_PATH_FRAGMENTS = [
  ".github/workflows",
  ".github/actions",
  ".circleci",
  ".gitlab-ci",
  "Jenkinsfile",
  ".travis.yml",
  "azure-pipelines",
  ".buildkite",
  "bitbucket-pipelines",
];

export function classifyConfig(
  name: string,
  relativePath: string,
): ConfigType | null {
  const exact = CONFIG_FILENAMES.get(name);
  if (exact) return exact;

  for (const fragment of CI_PATH_FRAGMENTS) {
    if (relativePath.includes(fragment)) return "ci";
  }

  // Generic *.config.{ts,js,mjs,cjs} not already matched above
  if (/\.config\.(ts|js|mjs|cjs|mts)$/.test(name)) return "other";

  return null;
}

export function getExtension(name: string): string {
  return path.extname(name).toLowerCase();
}

export function isSourceFile(name: string): boolean {
  return SOURCE_EXTENSIONS.has(getExtension(name));
}

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".vue",
  ".svelte",
  ".astro",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".cs",
  ".md",
  ".mdx",
]);
