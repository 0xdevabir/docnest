import path from "node:path";

import type { Entrypoint, PackageJson } from "../types.js";

export function detectEntrypoints(
  root: string,
  pkg: PackageJson,
  pkgJsonPath: string,
): Entrypoint[] {
  const results: Entrypoint[] = [];
  const pkgDir = path.dirname(pkgJsonPath);

  function entry(
    filePath: string,
    type: Entrypoint["type"],
    name?: string,
  ): Entrypoint {
    const abs = path.resolve(pkgDir, filePath);
    const base: Entrypoint = { path: abs, relativePath: path.relative(root, abs), type };
    if (name !== undefined) base.name = name;
    return base;
  }

  if (pkg.main) results.push(entry(pkg.main, "main"));
  if (pkg.module) results.push(entry(pkg.module, "module"));

  if (pkg.bin) {
    if (typeof pkg.bin === "string") {
      results.push(entry(pkg.bin, "bin", pkg.name));
    } else {
      for (const [name, binPath] of Object.entries(pkg.bin)) {
        results.push(entry(binPath, "bin", name));
      }
    }
  }

  if (pkg.exports) {
    for (const p of extractExportLeaves(pkg.exports, pkgDir, root)) {
      results.push(p);
    }
  }

  // Fallback: add a candidate index path when no explicit entrypoints found
  if (results.length === 0) {
    for (const candidate of [
      "src/index.ts",
      "src/index.js",
      "index.ts",
      "index.js",
    ]) {
      results.push(entry(candidate, "index"));
      break;
    }
  }

  return results;
}

function extractExportLeaves(
  exports: unknown,
  pkgDir: string,
  root: string,
): Entrypoint[] {
  if (typeof exports === "string" && exports.startsWith(".")) {
    const abs = path.resolve(pkgDir, exports);
    return [{ path: abs, relativePath: path.relative(root, abs), type: "exports" }];
  }
  if (typeof exports === "object" && exports !== null) {
    return Object.values(exports).flatMap((v) =>
      extractExportLeaves(v, pkgDir, root),
    );
  }
  return [];
}
