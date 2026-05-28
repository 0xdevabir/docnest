import { PluginLoadError } from "../core/errors/index.js";
import type { Logger } from "../core/logger/index.js";

import type { DocSmithPlugin, PluginFactory } from "./types.js";

/**
 * Resolve a plugin entry to a `DocSmithPlugin` instance.
 *
 * Accepts:
 *   - A direct plugin object: `{ name, setup, ... }`
 *   - A factory function: `(opts) => ({ name, ... })`
 *   - A [factory, options] tuple: `[fn, { key: "value" }]`
 */
export async function resolvePlugin(
  entry: unknown,
): Promise<DocSmithPlugin> {
  if (typeof entry === "function") {
    const plugin = (entry as PluginFactory)();
    return plugin;
  }

  if (Array.isArray(entry) && typeof entry[0] === "function") {
    const [factory, options] = entry as [PluginFactory, Record<string, unknown>];
    return factory(options);
  }

  if (isPluginObject(entry)) {
    return entry;
  }

  throw new Error(
    `Invalid plugin entry: expected a plugin object, factory function, or [factory, options] tuple.`,
  );
}

/**
 * Load plugins declared in the config as package-name strings.
 * Dynamically imports the package and calls `resolvePlugin` on the export.
 */
export async function loadPluginFromPackage(
  packageName: string,
  options: Record<string, unknown> | undefined,
  logger: Logger,
): Promise<DocSmithPlugin> {
  logger.debug(`Loading plugin package: ${packageName}`);

  let mod: unknown;
  try {
    mod = await import(packageName);
  } catch (cause) {
    throw new PluginLoadError(packageName, cause);
  }

  // Support both `export default plugin` and `module.exports = plugin`
  const exported =
    (mod as { default?: unknown }).default !== undefined
      ? (mod as { default: unknown }).default
      : mod;

  if (typeof exported === "function") {
    return (exported as PluginFactory)(options);
  }

  if (isPluginObject(exported)) {
    return exported;
  }

  throw new PluginLoadError(
    packageName,
    `Package does not export a valid DocSmith plugin.`,
  );
}

function isPluginObject(value: unknown): value is DocSmithPlugin {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as DocSmithPlugin).name === "string"
  );
}
