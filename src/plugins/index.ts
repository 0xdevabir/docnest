import type { DocSmithConfig } from "../core/config/index.js";
import { PluginError } from "../core/errors/index.js";
import { Logger } from "../core/logger/index.js";

import { loadPluginFromPackage, resolvePlugin } from "./loader.js";
import type { DocSmithPlugin, PluginContext } from "./types.js";

export type { DocSmithPlugin, PluginContext };
export type { PluginFactory } from "./types.js";

// ── Plugin Runner ──────────────────────────────────────────────────────────

/**
 * Manages the full lifecycle of all plugins for a single build / serve run.
 */
export class PluginRunner {
  private plugins: DocSmithPlugin[] = [];
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Load and register all plugins declared in the config.
   * Must be called before any lifecycle hooks are fired.
   */
  async load(config: DocSmithConfig): Promise<void> {
    for (const entry of config.plugins) {
      let plugin: DocSmithPlugin;

      if (typeof entry === "string") {
        plugin = await loadPluginFromPackage(entry, undefined, this.logger);
      } else if (Array.isArray(entry)) {
        const [nameOrFactory, options] = entry;
        if (typeof nameOrFactory === "string") {
          plugin = await loadPluginFromPackage(
            nameOrFactory,
            options as Record<string, unknown>,
            this.logger,
          );
        } else {
          plugin = await resolvePlugin(entry);
        }
      } else {
        plugin = await resolvePlugin(entry);
      }

      this.plugins.push(plugin);
      this.logger.debug(`Registered plugin: ${plugin.name}`);
    }
  }

  async runHook<K extends keyof DocSmithPlugin>(
    hook: K,
    ctx: PluginContext,
    error?: Error,
  ): Promise<void> {
    for (const plugin of this.plugins) {
      const fn = plugin[hook];
      if (typeof fn !== "function") continue;

      try {
        if (hook === "buildError" && error) {
          await (fn as (ctx: PluginContext, e: Error) => Promise<void>)(
            ctx,
            error,
          );
        } else {
          await (fn as (ctx: PluginContext) => Promise<void>)(ctx);
        }
      } catch (cause) {
        throw new PluginError(
          plugin.name,
          `Hook "${String(hook)}" threw: ${cause instanceof Error ? cause.message : String(cause)}`,
        );
      }
    }
  }

  get count(): number {
    return this.plugins.length;
  }
}
