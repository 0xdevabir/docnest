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
  output: {
    dir: "./docs-out",
    clean: true,
  },
  plugins: [],
  meta: {},
};
