import type { AnalysisResult, GraphEdge, ModuleGraph } from "../analyzer/types.js";
import {
  categorizeNode,
  computeDepths,
  computeHubThreshold,
  computeImportance,
  computeMetrics,
  findEntryPoints,
} from "./analyzer.js";
import { detectEnhancedCycles } from "./cycles.js";
import type {
  DependencyEdge,
  DependencyGraph,
  DependencyNode,
  EdgeKind,
} from "./types.js";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Builds a fully enriched `DependencyGraph` from an `AnalysisResult`.
 * This is the primary entry point after running `ASTAnalyzerService`.
 */
export function buildDependencyGraph(
  result: AnalysisResult,
  _root: string,
): DependencyGraph {
  return buildFromModuleGraph(result.graph);
}

/**
 * Builds a `DependencyGraph` directly from a raw `ModuleGraph`.
 * Use when you already have a graph from the analyzer layer and
 * don't need the full `AnalysisResult`.
 */
export function buildFromModuleGraph(moduleGraph: ModuleGraph): DependencyGraph {
  const { nodes: rawNodes, edges: rawEdges, reverseEdges, edgeMeta } = moduleGraph;

  // ── 1. Build flat, deduplicated edge list with enriched metadata ───────────
  const maxBindings = computeMaxBindings(edgeMeta);
  const edges = buildEdgeList(edgeMeta, maxBindings);

  // ── 2. Build adjacency maps from the enriched edge list ───────────────────
  const adjacency = new Map<string, Set<string>>();
  const reverseAdjacency = new Map<string, Set<string>>();

  for (const edge of edges) {
    const fwd = adjacency.get(edge.from) ?? new Set<string>();
    fwd.add(edge.to);
    adjacency.set(edge.from, fwd);

    const rev = reverseAdjacency.get(edge.to) ?? new Set<string>();
    rev.add(edge.from);
    reverseAdjacency.set(edge.to, rev);
  }

  // ── 3. Node metrics ────────────────────────────────────────────────────────
  const entryPoints = findEntryPoints(rawNodes, reverseEdges);
  const importance = computeImportance(rawNodes, reverseEdges, rawEdges);
  const depths = computeDepths(rawNodes, rawEdges, entryPoints);
  const hubThreshold = computeHubThreshold(rawNodes, reverseEdges);

  // ── 4. Cycle analysis ──────────────────────────────────────────────────────
  const cycles = detectEnhancedCycles(moduleGraph);

  const pathToCycles = new Map<string, number[]>();
  for (const cycle of cycles) {
    for (const p of cycle.chain) {
      const arr = pathToCycles.get(p) ?? [];
      arr.push(cycle.id);
      pathToCycles.set(p, arr);
    }
  }

  // ── 5. Build enriched nodes ────────────────────────────────────────────────
  const enrichedNodes = new Map<string, DependencyNode>();
  const hubs = new Set<string>();
  const leaves = new Set<string>();
  const isolated = new Set<string>();

  for (const [path, rawNode] of rawNodes) {
    const inDegree = reverseEdges.get(path)?.size ?? 0;
    const outDegree = rawEdges.get(path)?.size ?? 0;

    const category = categorizeNode(
      path,
      rawNode,
      inDegree,
      outDegree,
      hubThreshold,
    );

    const node: DependencyNode = {
      path,
      relativePath: rawNode.relativePath,
      exports: rawNode.exports,
      isBarrel: rawNode.isBarrel,
      isExternal: rawNode.isExternal,
      inDegree,
      outDegree,
      importance: importance.get(path) ?? 0,
      depth: depths.get(path) ?? 0,
      category,
      cycleIds: pathToCycles.get(path) ?? [],
    };

    enrichedNodes.set(path, node);

    if (category === "hub") hubs.add(path);
    else if (category === "leaf") leaves.add(path);
    else if (category === "isolated") isolated.add(path);
  }

  // ── 6. Graph-level metrics ─────────────────────────────────────────────────
  const metrics = computeMetrics(enrichedNodes, edges, cycles.length);

  return {
    nodes: enrichedNodes,
    edges,
    adjacency,
    reverseAdjacency,
    cycles,
    metrics,
    entryPoints,
    hubs,
    leaves,
    isolated,
    moduleGraph,
  };
}

// ─── Internals ────────────────────────────────────────────────────────────────

function buildEdgeList(
  edgeMeta: Map<string, GraphEdge[]>,
  maxBindings: number,
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  // Deduplicate (from, to) pairs — multiple AST edges between the same pair
  // are collapsed into one graph edge (first occurrence wins for metadata).
  const seen = new Set<string>();

  for (const metas of edgeMeta.values()) {
    for (const e of metas) {
      const key = `${e.from}→${e.to}`;
      if (seen.has(key)) continue;
      seen.add(key);

      edges.push({
        from: e.from,
        to: e.to,
        bindings: e.bindings,
        isType: e.isType,
        kind: inferEdgeKind(e),
        weight: maxBindings > 0 ? e.bindings.length / maxBindings : 0,
      });
    }
  }

  return edges;
}

function inferEdgeKind(edge: GraphEdge): EdgeKind {
  if (edge.isType) return "type";
  if (edge.bindings.length === 0) return "side-effect";
  if (edge.bindings.includes("*")) return "reexport";
  return "value";
}

function computeMaxBindings(edgeMeta: Map<string, GraphEdge[]>): number {
  let max = 1;
  for (const edges of edgeMeta.values()) {
    for (const e of edges) {
      if (e.bindings.length > max) max = e.bindings.length;
    }
  }
  return max;
}
