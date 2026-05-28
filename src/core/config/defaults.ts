import type { DocSmithConfig } from "./schema.js";

/**
 * Baseline defaults. The Zod schema applies these automatically via
 * `.default(...)` calls, so this file exists primarily for documentation
 * purposes and for use in tests that need a fully-resolved config object.
 */
export const DEFAULT_CONFIG: DocSmithConfig = {
  name: "My Docs",
  include: ["docs/**/*.md", "README.md"],
  exclude: ["node_modules/**", "dist/**"],
  ignoredFolders: [
    "node_modules",
    ".git",
    "dist",
    ".next",
    ".nuxt",
    "build",
    "coverage",
  ],
  output: {
    dir: "./docs-out",
    clean: true,
    assetsDir: "assets",
    format: "html",
  },
  ai: {
    provider: "anthropic",
    maxTokens: 4096,
    temperature: 0.3,
    timeout: 30_000,
  },
  diagrams: {
    enabled: true,
    engine: "mermaid",
    outputFormat: "svg",
    options: {},
  },
  templates: {
    layout: "default",
    variables: {},
  },
  framework: {
    type: "auto",
    overrides: {},
  },
  plugins: [],
  meta: {},
};
