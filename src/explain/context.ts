import path from "node:path";
import { readFile } from "../utils/fs.js";
import { scanRepository } from "../scanner/index.js";
import type { ExplainContext, ExplainOptions } from "./types.js";

interface RawPackageJson {
  name?: string;
  version?: string;
  description?: string;
}

async function readPackageJson(root: string): Promise<RawPackageJson> {
  try {
    const raw = await readFile(path.join(root, "package.json"));
    return JSON.parse(raw) as RawPackageJson;
  } catch {
    return {};
  }
}

export async function buildExplainContext(
  root: string,
  options: ExplainOptions = {},
): Promise<ExplainContext> {
  const [structure, pkg] = await Promise.all([
    scanRepository({ root }),
    readPackageJson(root),
  ]);

  const projectName =
    pkg.name ??
    structure.packageJson?.name ??
    path.basename(root);

  const ctx: ExplainContext = {
    root,
    projectName,
    structure,
    ...(pkg.description !== undefined && { description: pkg.description }),
    ...(pkg.version !== undefined && { version: pkg.version }),
  };

  if (options.skipAnalysis === true) return ctx;

  const sourceFiles = structure.files
    .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f.name))
    .map((f) => f.path);

  if (sourceFiles.length === 0) return ctx;

  const [
    { ASTAnalyzerService },
    { ArchitectureAnalyzerService },
    { buildDependencyGraph },
  ] = await Promise.all([
    import("../analyzer/service.js"),
    import("../architecture/service.js"),
    import("../dependency-graph/service.js"),
  ]);

  const astSvc = new ASTAnalyzerService();
  ctx.analysis = await astSvc.analyze({ root, files: sourceFiles });

  const archSvc = new ArchitectureAnalyzerService();
  ctx.archMap = archSvc.analyze(ctx.analysis, {
    root,
    ...(options.minConfidence !== undefined && { minConfidence: options.minConfidence }),
  });

  ctx.depGraph = buildDependencyGraph(ctx.analysis, root);

  return ctx;
}
