import type { DocSmithConfig } from "../core/config/index.js";
import type { Logger } from "../core/logger/index.js";

// ── Plugin lifecycle hooks ─────────────────────────────────────────────────

export interface PluginContext {
  /** The fully-resolved DocSmith config for this build. */
  config: DocSmithConfig;
  /** Scoped logger for the plugin. */
  logger: Logger;
  /** Absolute path to the project root. */
  root: string;
}

/**
 * A DocSmith plugin.
 *
 * Plugins are plain objects (or factory functions that return plain objects).
 * Each hook is optional — a plugin only needs to implement what it cares about.
 */
export interface DocSmithPlugin {
  /** Unique identifier used in error messages and logging. */
  name: string;

  /**
   * Called once after config is resolved but before any processing starts.
   * Use this to validate plugin options or register any global state.
   */
  setup?: (ctx: PluginContext) => void | Promise<void>;

  /**
   * Called before the build pipeline starts processing files.
   */
  buildStart?: (ctx: PluginContext) => void | Promise<void>;

  /**
   * Called after the entire build pipeline has completed successfully.
   */
  buildEnd?: (ctx: PluginContext) => void | Promise<void>;

  /**
   * Called when the build fails.
   */
  buildError?: (ctx: PluginContext, error: Error) => void | Promise<void>;

  /**
   * Called when the dev server starts (future).
   */
  serverStart?: (ctx: PluginContext) => void | Promise<void>;

  /**
   * Called when the dev server stops (future).
   */
  serverStop?: (ctx: PluginContext) => void | Promise<void>;
}

/** Factory signature — plugins can export a function that accepts options. */
export type PluginFactory<TOptions = Record<string, unknown>> = (
  options?: TOptions,
) => DocSmithPlugin;
