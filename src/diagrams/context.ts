import { scanRepository } from "../scanner/index.js";
import type { DiagramContext, DiagramOptions } from "./types.js";

export async function buildDiagramContext(
  root: string,
  options: DiagramOptions = {},
): Promise<DiagramContext> {
  const ctx: DiagramContext = { root, options };
  if (options.skipAnalysis === true) return ctx;

  const structure = await scanRepository({ root });
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
