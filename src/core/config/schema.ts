import { z } from "zod";

// ── Sub-schemas ────────────────────────────────────────────────────────────

const OutputSchema = z.object({
  dir: z.string().default("./docs-out"),
  clean: z.boolean().default(true),
  assetsDir: z.string().default("assets"),
  format: z.enum(["html", "markdown", "json"]).default("html"),
});

const AIConfigSchema = z.object({
  provider: z
    .enum(["anthropic", "openai", "ollama", "custom"])
    .default("anthropic"),
  model: z.string().optional(),
  // Prefer env vars (ANTHROPIC_API_KEY, OPENAI_API_KEY); this field is a
  // last-resort escape hatch. Never commit real keys here.
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(2).default(0.3),
  timeout: z.number().int().positive().default(30_000),
});

const DiagramSchema = z.object({
  enabled: z.boolean().default(true),
  engine: z.enum(["mermaid", "plantuml", "d2"]).default("mermaid"),
  theme: z.string().optional(),
  outputFormat: z.enum(["svg", "png"]).default("svg"),
  // Forwarded verbatim to the active diagram engine plugin.
  options: z.record(z.unknown()).default({}),
});

const TemplatesSchema = z.object({
  dir: z.string().optional(),
  layout: z.string().default("default"),
  variables: z.record(z.unknown()).default({}),
});

const FrameworkSchema = z.object({
  type: z
    .enum(["auto", "next", "vite", "astro", "remix", "none"])
    .default("auto"),
  srcDir: z.string().optional(),
  publicDir: z.string().optional(),
  // Escape hatch: arbitrary key/value pairs forwarded to the framework adapter.
  overrides: z.record(z.unknown()).default({}),
});

// Plugin entry — three equivalent forms so config files stay readable:
//   "my-plugin"
//   ["my-plugin", { option: true }]
//   { name: "my-plugin", options: { option: true }, enabled: true }
const PluginObjectSchema = z.object({
  name: z.string().min(1),
  options: z.record(z.unknown()).optional(),
  enabled: z.boolean().default(true),
});

export const PluginEntrySchema = z.union([
  z.string(),
  z.tuple([z.string(), z.record(z.unknown())]),
  PluginObjectSchema,
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

  /** Top-level folder names that are never scanned for source files,
   *  regardless of include patterns. Faster than per-glob exclusion. */
  ignoredFolders: z
    .array(z.string())
    .default([
      "node_modules",
      ".git",
      "dist",
      ".next",
      ".nuxt",
      "build",
      "coverage",
    ]),

  /** Output configuration. */
  output: OutputSchema.default({}),

  /** Base URL for deployed docs (used for absolute links, sitemaps). */
  baseUrl: z.string().url().optional(),

  /** AI provider settings used by `generate` and `explain` commands. */
  ai: AIConfigSchema.default({}),

  /** Diagram rendering configuration. */
  diagrams: DiagramSchema.default({}),

  /** Documentation template settings. */
  templates: TemplatesSchema.default({}),

  /** Framework detection and override settings. */
  framework: FrameworkSchema.default({}),

  /** Ordered list of plugins to apply. */
  plugins: z.array(PluginEntrySchema).default([]),

  /** Free-form metadata forwarded to themes / plugins. */
  meta: z.record(z.unknown()).default({}),
});

// ── Exported types ─────────────────────────────────────────────────────────

export type DocSmithConfig = z.infer<typeof DocSmithConfigSchema>;
export type PluginEntry = z.infer<typeof PluginEntrySchema>;
export type AIConfig = z.infer<typeof AIConfigSchema>;
export type DiagramConfig = z.infer<typeof DiagramSchema>;
export type TemplatesConfig = z.infer<typeof TemplatesSchema>;
export type FrameworkConfig = z.infer<typeof FrameworkSchema>;
export type OutputConfig = z.infer<typeof OutputSchema>;

// Input type: what users write in docsmith.config.ts (pre-Zod-coercion).
// All fields with .default() are optional; only `name` is required.
export type DocSmithUserConfig = z.input<typeof DocSmithConfigSchema>;
