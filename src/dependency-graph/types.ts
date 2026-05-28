import type { ModuleGraph } from "../analyzer/types.js";

// ─── Node ─────────────────────────────────────────────────────────────────────

/** Structural role of a module in the dependency graph. */
export type NodeCategory =
  | "entry"    // no incoming edges, has outgoing — root of dependency tree
  | "hub"      // high in-degree — widely shared utility or lib
  | "leaf"     // no outgoing internal edges — pure implementation
  | "barrel"   // re-export only file
  | "external" // node_modules package
  | "isolated" // no edges at all
  | "internal"; // regular internal module

export interface DependencyNode {
  path: string;
  relativePath: string;
  exports: string[];
  isBarrel: boolean;
  isExternal: boolean;
  /** Number of modules that import this one. */
  inDegree: number;
  /** Number of modules this one imports. */
  outDegree: number;
  /** PageRank-style importance score, normalised to [0, 1]. */
  importance: number;
  /** BFS distance from the nearest entry point. */
  depth: number;
  category: NodeCategory;
  /** Indices into DependencyGraph.cycles — non-empty when node is part of a cycle. */
  cycleIds: number[];
}

// ─── Edge ─────────────────────────────────────────────────────────────────────

export type EdgeKind =
  | "value"       // runtime value import
  | "type"        // type-only import (erased at compile time)
  | "reexport"    // re-export / barrel passthrough
  | "side-effect"; // bare import with no bindings

export interface DependencyEdge {
  from: string;
  to: string;
  bindings: string[];
  isType: boolean;
  kind: EdgeKind;
  /** Relative weight (0–1) based on binding count normalised to graph max. */
  weight: number;
}

// ─── Cycles ───────────────────────────────────────────────────────────────────

export type CycleSeverity =
  | "low"    // all edges in the cycle are type-only
  | "medium" // cycle has ≤ 2 nodes (self-import or pair) with value edges
  | "high";  // cycle has > 2 nodes with value edges

export interface CircularDependency {
  id: number;
  /** Paths forming the cycle. Last element equals the first (closed loop). */
  chain: string[];
  /** Number of distinct nodes in the cycle (chain.length - 1). */
  length: number;
  severity: CycleSeverity;
  /** The weakest edge — removing it would break the cycle with minimal impact. */
  suggestedBreak?: { from: string; to: string };
}

// ─── Graph ────────────────────────────────────────────────────────────────────

export interface GraphMetrics {
  totalNodes: number;
  internalNodes: number;
  externalNodes: number;
  totalEdges: number;
  valueEdges: number;
  typeEdges: number;
  cycleCount: number;
  maxDepth: number;
  avgInDegree: number;
  avgOutDegree: number;
  /** edges / (n × (n-1)) for internal nodes — graph connectivity density. */
  density: number;
}

export interface DependencyGraph {
  /** Absolute path → enriched node. */
  nodes: Map<string, DependencyNode>;
  /** Flat deduplicated edge list. */
  edges: DependencyEdge[];
  /** from path → set of to paths. */
  adjacency: Map<string, Set<string>>;
  /** to path → set of from paths (consumers). */
  reverseAdjacency: Map<string, Set<string>>;
  cycles: CircularDependency[];
  metrics: GraphMetrics;
  /** Modules with no incoming edges and at least one outgoing edge. */
  entryPoints: Set<string>;
  /** Modules with in-degree in the top 10 % — widely shared utilities. */
  hubs: Set<string>;
  /** Modules with no outgoing internal edges. */
  leaves: Set<string>;
  /** Modules with zero edges. */
  isolated: Set<string>;
  /** Original ModuleGraph for interop with the analyzer layer. */
  moduleGraph: ModuleGraph;
}

// ─── Chain / Path ─────────────────────────────────────────────────────────────

export interface DependencyChain {
  from: string;
  to: string;
  /** Ordered list of absolute paths from `from` to `to` (inclusive). */
  path: string[];
  /** Number of hops (path.length - 1). */
  length: number;
  /** True if any node along the path participates in a cycle. */
  containsCycle: boolean;
}

// ─── Serialization ────────────────────────────────────────────────────────────

export interface SerializedNode {
  id: string;
  relativePath: string;
  exports: string[];
  isBarrel: boolean;
  isExternal: boolean;
  inDegree: number;
  outDegree: number;
  importance: number;
  depth: number;
  category: NodeCategory;
  cycleIds: number[];
}

export interface SerializedEdge {
  from: string;
  to: string;
  bindings: string[];
  isType: boolean;
  kind: EdgeKind;
  weight: number;
}

export interface SerializedGraph {
  version: "1";
  generatedAt: string;
  root: string;
  metrics: GraphMetrics;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  cycles: CircularDependency[];
}

// ─── Mermaid ──────────────────────────────────────────────────────────────────

export type MermaidDirection = "TD" | "LR" | "BT" | "RL";

export interface MermaidOptions {
  direction?: MermaidDirection;
  /** Maximum nodes to render (default: 200). Lowest-importance nodes are dropped first. */
  maxNodes?: number;
  /** Exclude external package nodes (default: true). */
  internalOnly?: boolean;
  /** Colour nodes that participate in cycles red (default: true). */
  highlightCycles?: boolean;
  /** Group nodes into subgraphs by top-level source directory (default: true). */
  groupByDirectory?: boolean;
  /** Only include nodes with importance >= this threshold (default: 0). */
  minImportance?: number;
}

export interface MermaidNode {
  id: string;
  label: string;
  shape: "rect" | "rounded" | "diamond" | "hexagon";
  style?: string;
}

export interface MermaidEdge {
  from: string;
  to: string;
  label?: string;
  style: "solid" | "dashed";
}

export interface MermaidSubgraph {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface MermaidGraph {
  direction: MermaidDirection;
  nodes: MermaidNode[];
  edges: MermaidEdge[];
  subgraphs: MermaidSubgraph[];
}

// ─── D3 ───────────────────────────────────────────────────────────────────────

export interface D3Node {
  id: string;
  label: string;
  /** Maps to NodeCategory for colour grouping. */
  group: NodeCategory;
  importance: number;
  inDegree: number;
  outDegree: number;
  isExternal: boolean;
}

export interface D3Link {
  source: string;
  target: string;
  /** Edge weight [0, 1]. */
  value: number;
  isType: boolean;
  kind: EdgeKind;
}

export interface D3Graph {
  nodes: D3Node[];
  links: D3Link[];
}
