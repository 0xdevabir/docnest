import path from "node:path";
import { cosmiconfig, type CosmiconfigResult } from "cosmiconfig";
import { ZodError } from "zod";

import {
  ConfigNotFoundError,
  ConfigValidationError,
} from "../errors/index.js";
import { getTypeScriptLoader } from "./loader.js";
import {
  DocSmithConfigSchema,
  type DocSmithConfig,
  type DocSmithUserConfig,
} from "./schema.js";

export type { DocSmithConfig, DocSmithUserConfig };

// ── Lazy explorer ──────────────────────────────────────────────────────────
// Built once on first use — avoids re-initialising the jiti loader on every
// loadConfig call while still supporting async initialisation.

const MODULE_NAME = "docsmith";
let _explorer: ReturnType<typeof cosmiconfig> | null = null;

async function getExplorer(): Promise<ReturnType<typeof cosmiconfig>> {
  if (_explorer) return _explorer;

  const tsLoader = await getTypeScriptLoader();

  _explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      "docsmith.config.ts",
      "docsmith.config.js",
      "docsmith.config.mjs",
      "docsmith.config.cjs",
      "docsmith.config.json",
      ".docsmithrc",
      ".docsmithrc.json",
      ".docsmithrc.yaml",
      ".docsmithrc.yml",
      "package.json",
    ],
    loaders: {
      ".ts": tsLoader,
      ".mts": tsLoader,
      ".cts": tsLoader,
    },
  });

  return _explorer;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Type-safe helper for docsmith.config.ts — enables full autocomplete without
 * importing internal Zod schemas. Mirrors the pattern used by Vite, Vitest, etc.
 *
 * @example
 * // docsmith.config.ts
 * import { defineConfig } from "docsmith";
 * export default defineConfig({
 *   name: "My Docs",
 *   ai: { provider: "anthropic" },
 *   diagrams: { engine: "mermaid" },
 * });
 */
export function defineConfig(config: DocSmithUserConfig): DocSmithUserConfig {
  return config;
}

export interface LoadConfigOptions {
  /** Explicit path to a config file — skips cosmiconfig search if provided. */
  configPath?: string;
  /** Directory to start the cosmiconfig search from. Defaults to cwd. */
  cwd?: string;
}

export interface ResolvedConfig {
  config: DocSmithConfig;
  /** Absolute path to the file the config was loaded from. */
  filepath: string;
}

/**
 * Load, parse, and validate the DocSmith config.
 * Throws typed errors on missing or invalid config.
 */
export async function loadConfig(
  options: LoadConfigOptions = {},
): Promise<ResolvedConfig> {
  const cwd = options.cwd ?? process.cwd();
  const explorer = await getExplorer();

  let result: CosmiconfigResult;
  try {
    result = options.configPath
      ? await explorer.load(options.configPath)
      : await explorer.search(cwd);
  } catch (cause) {
    throw new ConfigNotFoundError([options.configPath ?? cwd]);
  }

  if (!result || result.isEmpty) {
    throw new ConfigNotFoundError([
      path.join(cwd, "docsmith.config.{ts,js,json}"),
    ]);
  }

  try {
    const config = DocSmithConfigSchema.parse(result.config);
    return { config, filepath: result.filepath };
  } catch (cause) {
    if (cause instanceof ZodError) {
      const issues = cause.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      throw new ConfigValidationError(issues);
    }
    throw cause;
  }
}

/**
 * Like `loadConfig` but returns `null` instead of throwing when no config
 * file is found. Useful for commands that work with or without a config.
 */
export async function tryLoadConfig(
  options: LoadConfigOptions = {},
): Promise<ResolvedConfig | null> {
  try {
    return await loadConfig(options);
  } catch (err) {
    if (err instanceof ConfigNotFoundError) return null;
    throw err;
  }
}
