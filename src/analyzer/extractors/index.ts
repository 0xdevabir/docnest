import { posix } from "node:path";

import ts from "typescript";

import type { FileAnalysis, SourceLanguage } from "../types.js";
import { extractApiRoutes } from "./api-routes.js";
import { extractClasses } from "./classes.js";
import { extractComponents } from "./components.js";
import { extractExports, resolveExportSources } from "./exports.js";
import { extractFunctions } from "./functions.js";
import { extractHooks } from "./hooks.js";
import { extractImports } from "./imports.js";
import { extractServices } from "./services.js";

export function analyzeSourceFile(
  sf: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
  rootDir: string,
): FileAnalysis {
  const filePath = sf.fileName;
  const relativePath = posix.relative(rootDir, filePath);
  const language = detectLanguage(filePath);
  const directives = extractDirectives(sf);
  const isServerComponentFile = isServerComponent(filePath, directives);

  const imports = extractImports(sf, compilerOptions);
  const exports = extractExports(sf);
  const functions = extractFunctions(sf);
  const classes = extractClasses(sf);
  const hooks = extractHooks(sf);
  const components = extractComponents(sf, isServerComponentFile);
  const apiRoutes = extractApiRoutes(sf, filePath);
  const services = extractServices(sf, classes);

  resolveExportSources(exports, filePath, compilerOptions);

  const hasDefaultExport = exports.some((e) => e.kind === "default");
  const isBarrelFile =
    exports.length > 0 &&
    exports.every(
      (e) => e.kind === "re-export-named" || e.kind === "re-export-all",
    ) &&
    functions.length === 0 &&
    classes.length === 0;

  return {
    path: filePath,
    relativePath,
    language,
    directives,
    exports,
    imports,
    components,
    functions,
    apiRoutes,
    hooks,
    classes,
    services,
    hasDefaultExport,
    isBarrelFile,
    analyzedAt: Date.now(),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectLanguage(filePath: string): SourceLanguage {
  if (filePath.endsWith(".tsx")) return "tsx";
  if (filePath.endsWith(".jsx")) return "jsx";
  if (filePath.endsWith(".ts") || filePath.endsWith(".mts") || filePath.endsWith(".cts")) {
    return "typescript";
  }
  return "javascript";
}

function extractDirectives(sf: ts.SourceFile): string[] {
  const directives: string[] = [];
  for (const stmt of sf.statements) {
    if (ts.isExpressionStatement(stmt) && ts.isStringLiteral(stmt.expression)) {
      directives.push(stmt.expression.text);
    } else {
      // Directives must precede all non-import statements
      if (!ts.isImportDeclaration(stmt)) break;
    }
  }
  return directives;
}

function isServerComponent(filePath: string, directives: string[]): boolean {
  if (directives.includes("use client")) return false;
  // Heuristic: file sits under app/ directory → Next.js App Router
  return /[/\\]app[/\\]/.test(filePath);
}

export { extractImports, extractExports, extractFunctions, extractClasses };
export { extractComponents, extractHooks, extractApiRoutes, extractServices };
