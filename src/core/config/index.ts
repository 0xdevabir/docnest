import path from "node:path";

import { cosmiconfig } from "cosmiconfig";
import { ZodError } from "zod";

import { ConfigNotFoundError, ConfigValidationError } from "../errors/index.js";

import { DocSmithConfigSchema, type DocSmithConfig } from "./schema.js";

export type { DocSmithConfig };

// ── Cosmiconfig search order ───────────────────────────────────────────────
// cosmiconfig will walk up from cwd looking for these files in this order.

const MODULE_NAME = "docsmith";

const explorer = cosmiconfig(MODULE_NAME, {
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
});

// ── Public API ─────────────────────────────────────────────────────────────

export interface LoadConfigOptions {
  /** Explicit path to a config file — skips search if provided. */
  configPath?: string;
  /** Directory to start cosmiconfig search from. Defaults to cwd. */
  cwd?: string;
}

export interface ResolvedConfig {
  config: DocSmithConfig;
  /** Absolute path to the file the config was loaded from. */
  filepath: string;
}

/**
 * Load, parse, and validate the DocSmith configuration.
 * Throws typed errors on missing or invalid config.
 */
export async function loadConfig(
  options: LoadConfigOptions = {},
): Promise<ResolvedConfig> {
  const cwd = options.cwd ?? process.cwd();

  let result;

  try {
    result = options.configPath
      ? await explorer.load(options.configPath)
      : await explorer.search(cwd);
  } catch (cause) {
    const filePath = options.configPath ?? cwd;
    throw new ConfigNotFoundError([filePath]);
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
  } catch (error) {
    if (error instanceof ConfigNotFoundError) return null;
    throw error;
  }
}
