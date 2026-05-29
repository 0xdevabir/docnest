import type { DiagramContext, DiagramResult } from "../types.js";
import { mermaidFence, mId } from "../utils.js";

export function generateModuleRelationsDiagram(ctx: DiagramContext): DiagramResult | null {
  const { analysis, options, root } = ctx;
  if (analysis === undefined) return null;

  const dir = options.direction ?? "LR";
  const maxNodes = options.maxNodes ?? 40;

  // Map absolute path → top-level module (first dir after root/src/)
  const pathToModule = new Map<string, string>();
  for (const absPath of analysis.files.keys()) {
    pathToModule.set(absPath, topModule(absPath, root));
  }

  // File count per module
  const moduleFiles = new Map<string, number>();
  for (const mod of pathToModule.values()) {
    moduleFiles.set(mod, (moduleFiles.get(mod) ?? 0) + 1);
  }

  // Aggregate cross-module import counts via graph edgeMeta
  const edgeWeights = new Map<string, number>();
  for (const [from, edges] of analysis.graph.edgeMeta) {
    const fromMod = pathToModule.get(from);
    if (fromMod === undefined) continue;
    for (const e of edges) {
      const toMod = pathToModule.get(e.to);
      if (toMod === undefined || toMod === fromMod) continue;
      const key = `${fromMod}→${toMod}`;
      edgeWeights.set(key, (edgeWeights.get(key) ?? 0) + 1);
    }
  }

  // Top N modules by file count
  const topModules = [...moduleFiles.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxNodes)
    .map(([name]) => name);

  if (topModules.length < 2) return null;

  const moduleSet = new Set(topModules);
  const lines: string[] = [`graph ${dir}`];

  // Compute in-degree to pick node shapes
  const inDegree = new Map<string, number>();
  for (const key of edgeWeights.keys()) {
    const sep = key.indexOf("→");
    const toMod = key.slice(sep + 1);
    if (moduleSet.has(toMod)) {
      inDegree.set(toMod, (inDegree.get(toMod) ?? 0) + 1);
    }
  }

  for (const mod of topModules) {
    const files = moduleFiles.get(mod) ?? 0;
    const degree = inDegree.get(mod) ?? 0;
    const nodeId = mId(mod);
    if (degree >= 4) {
      // Hexagon for hub modules
      lines.push(`  ${nodeId}{{"${mod} (${files}f)"}}`);
    } else {
      lines.push(`  ${nodeId}["${mod}\\n${files} files"]`);
    }
  }

  const seenEdges = new Set<string>();
  for (const [key, weight] of edgeWeights) {
    const sep = key.indexOf("→");
    const fromMod = key.slice(0, sep);
    const toMod = key.slice(sep + 1);
    if (!moduleSet.has(fromMod) || !moduleSet.has(toMod)) continue;
    const edgeKey = `${mId(fromMod)}→${mId(toMod)}`;
    if (seenEdges.has(edgeKey)) continue;
    seenEdges.add(edgeKey);
    const label = weight > 3 ? `|"${weight}"|` : "";
    lines.push(`  ${mId(fromMod)} -->${label} ${mId(toMod)}`);
  }

  const mermaid = lines.join("\n");
  return {
    type: "module-relations",
    title: "Module Relationships",
    mermaid,
    markdown: mermaidFence(mermaid),
  };
}

function topModule(absPath: string, root: string): string {
  const rel = absPath.startsWith(root + "/") ? absPath.slice(root.length + 1) : absPath;
  const clean = rel.startsWith("src/") ? rel.slice(4) : rel;
  return clean.split("/")[0] ?? clean;
}
