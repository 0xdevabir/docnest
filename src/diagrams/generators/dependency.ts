import { toMermaid, toMermaidString } from "../../dependency-graph/serializer.js";
import type { MermaidOptions } from "../../dependency-graph/types.js";
import type { DiagramContext, DiagramResult } from "../types.js";
import { mermaidFence } from "../utils.js";

export function generateDependencyDiagram(ctx: DiagramContext): DiagramResult | null {
  const { depGraph, options } = ctx;
  if (depGraph === undefined) return null;

  const opts: MermaidOptions = {
    direction: options.direction ?? "LR",
    maxNodes: options.maxNodes ?? 80,
    internalOnly: options.internalOnly ?? true,
    highlightCycles: true,
    groupByDirectory: true,
    minImportance: 0,
  };

  const graph = toMermaid(depGraph, opts);
  const mermaid = toMermaidString(graph);

  return {
    type: "dependency",
    title: "Dependency Graph",
    mermaid,
    markdown: mermaidFence(mermaid),
  };
}
