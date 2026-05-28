/**
 * DocSmith public API.
 *
 * This is the library entrypoint for consumers who `import` DocSmith
 * programmatically (e.g. a plugin, a test, or a custom build script).
 *
 * The CLI entrypoint is `src/cli/index.ts`.
 */

// Config
export { loadConfig, tryLoadConfig } from "./core/config/index.js";
export type { DocSmithConfig, LoadConfigOptions, ResolvedConfig } from "./core/config/index.js";

// Logger
export { Logger, logger } from "./core/logger/index.js";
export type { LogLevel, LoggerOptions } from "./core/logger/index.js";

// Errors
export {
  DocSmithError,
  ConfigError,
  ConfigNotFoundError,
  ConfigValidationError,
  PluginError,
  PluginLoadError,
  CommandError,
  FileSystemError,
} from "./core/errors/index.js";

// Plugin system
export { PluginRunner } from "./plugins/index.js";
export type { DocSmithPlugin, PluginContext, PluginFactory } from "./plugins/index.js";

// Types
export type { CliContext, Result, DeepPartial, Dict, Maybe, SemVer } from "./types/index.js";
export { ok, err } from "./types/index.js";
