// ─── Graph construction ───────────────────────────────────────────────────────
export { buildDependencyGraph, buildFromModuleGraph } from "./service.js";

// ─── Cycle detection ──────────────────────────────────────────────────────────
export { detectEnhancedCycles } from "./cycles.js";

// ─── Node / graph analytics ───────────────────────────────────────────────────
export {
  categorizeNode,
  computeDepths,
  computeHubThreshold,
  computeImportance,
  computeMetrics,
  findEntryPoints,
} from "./analyzer.js";

// ─── Chain / path analysis ────────────────────────────────────────────────────
export {
  findAllPaths,
  findShortestPath,
  longestChain,
  topologicalSort,
  transitiveConsumers,
  transitiveDeps,
} from "./chains.js";

// ─── Serialization / visualization ───────────────────────────────────────────
export {
  serializeGraph,
  toDot,
  toD3,
  toMermaid,
  toMermaidString,
} from "./serializer.js";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  CircularDependency,
  CycleSeverity,
  D3Graph,
  D3Link,
  D3Node,
  DependencyChain,
  DependencyEdge,
  DependencyGraph,
  DependencyNode,
  EdgeKind,
  GraphMetrics,
  MermaidDirection,
  MermaidEdge,
  MermaidGraph,
  MermaidNode,
  MermaidOptions,
  MermaidSubgraph,
  NodeCategory,
  SerializedEdge,
  SerializedGraph,
  SerializedNode,
} from "./types.js";

export type { DotOptions } from "./serializer.js";
export type { FindAllPathsOptions } from "./chains.js";
