import path from "node:path";

import { readFile } from "../utils/fs.js";
import { scanRepository } from "../scanner/index.js";
import { collectRoutes, groupByTag, inferPrimaryFramework } from "./collector.js";
import { renderApiDocs } from "./renderer.js";
import type { ApiDocsContext, ApiDocsOptions, ApiDocsResult, CollectedRoute } from "./types.js";

export { collectRoutes, groupByTag, inferPrimaryFramework, displayPath } from "./collector.js";
export { renderApiDocs } from "./renderer.js";
export type {
  ApiDocsContext,
  ApiDocsOptions,
  ApiDocsResult,
  CollectedRoute,
  RouteTag,
} from "./types.js";

/**
 * High-level entry point: scan → analyse → collect routes → render API.md.
 *
 * Call sequence:
 *   scanRepository()            → ProjectStructure (file list)
 *   ASTAnalyzerService.analyze  → AnalysisResult (per-file RouteAnalysis)
 *   collectRoutes()             → CollectedRoute[]
 *   groupByTag()                → RouteTag[]
 *   renderApiDocs()             → ApiDocsResult (markdown string)
 */
export async function generateApiDocs(
  root: string,
  opts: ApiDocsOptions = {},
): Promise<ApiDocsResult> {
  let projectName = path.basename(root);
  try {
    const raw = await readFile(path.join(root, "package.json"));
    const pkg = JSON.parse(raw) as { name?: string };
    if (pkg.name) projectName = pkg.name;
  } catch {
    // no package.json — use directory name
  }

  const structure = await scanRepository({ root });

  const sourceFiles = structure.files
    .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f.name))
    .map((f) => f.path);

  let routes: CollectedRoute[] = [];

  if (!opts.skipAnalysis && sourceFiles.length > 0) {
    const { ASTAnalyzerService } = await import("../analyzer/service.js");
    const svc = new ASTAnalyzerService();
    const result = await svc.analyze({ root, files: sourceFiles });
    routes = collectRoutes(result, root);
  }

  const framework = inferPrimaryFramework(routes);
  const tags = groupByTag(routes);

  const ctx: ApiDocsContext = {
    projectName,
    title: opts.title ?? "API Reference",
    framework,
    routes,
    tags,
    baseUrl: opts.baseUrl,
  };

  return renderApiDocs(ctx);
}
