import type { PackageJson, ScriptEntry } from "../types.js";

export function extractScripts(
  pkg: PackageJson,
  source: string,
): ScriptEntry[] {
  if (!pkg.scripts) return [];
  return Object.entries(pkg.scripts).map(([name, command]) => ({
    name,
    command,
    source,
  }));
}
