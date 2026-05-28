import { z } from "zod";

// ── Sub-schemas ────────────────────────────────────────────────────────────

const OutputSchema = z.object({
  /** Directory where DocSmith writes build artifacts. */
  dir: z.string().default("./docs-out"),
  /** Whether to clean the output dir before each build. */
  clean: z.boolean().default(true),
});

const PluginEntrySchema = z.union([
  z.string(),
  z.tuple([z.string(), z.record(z.unknown())]),
]);

// ── Root config schema ─────────────────────────────────────────────────────

export const DocSmithConfigSchema = z.object({
  /** Human-readable project name, used in page titles / metadata. */
  name: z.string().min(1),

  /** Project version — defaults to version in the nearest package.json. */
  version: z.string().optional(),

  /** Source glob patterns for documentation files. */
  include: z.array(z.string()).default(["docs/**/*.md", "README.md"]),

  /** Glob patterns to exclude from processing. */
  exclude: z.array(z.string()).default(["node_modules/**", "dist/**"]),

  /** Output configuration. */
  output: OutputSchema.default({}),

  /** Base URL for deployed docs (used for absolute links, sitemaps). */
  baseUrl: z.string().url().optional(),

  /** Ordered list of plugins to apply. Each entry is either a package name
   *  or a [name, options] tuple. */
  plugins: z.array(PluginEntrySchema).default([]),

  /** Free-form metadata forwarded to themes / plugins. */
  meta: z.record(z.unknown()).default({}),
});

export type DocSmithConfig = z.infer<typeof DocSmithConfigSchema>;
export type PluginEntry = z.infer<typeof PluginEntrySchema>;
