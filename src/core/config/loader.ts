import type { Loader } from "cosmiconfig";

// Lazily initialised — avoids importing jiti on every module load.
let _tsLoader: Loader | null = null;

/**
 * Returns a cosmiconfig-compatible loader that can execute TypeScript config
 * files on-the-fly using jiti (no ts-node, no separate compile step).
 *
 * The loader is memoised: jiti is imported once and reused across calls.
 * If jiti is not installed a helpful error is thrown at load time so the
 * user knows exactly what to do.
 */
export async function getTypeScriptLoader(): Promise<Loader> {
  if (_tsLoader) return _tsLoader;

  let jiti: { import: (path: string) => Promise<unknown> };

  try {
    const { createJiti } = await import("jiti");
    jiti = createJiti(import.meta.url, { interopDefault: true });
  } catch {
    _tsLoader = (_filepath: string) => {
      throw new Error(
        `TypeScript config files require "jiti".\n` +
          `Run: pnpm add jiti\n` +
          `Or rename your config to docsmith.config.js / .json.`,
      );
    };
    return _tsLoader;
  }

  _tsLoader = async (filepath: string) => {
    const mod = await jiti.import(filepath);
    return (mod as Record<string, unknown>)["default"] ?? mod;
  };

  return _tsLoader;
}
