import type { GraphNode } from "../analyzer/types.js";
import type { DependencyEdge, DependencyNode, GraphMetrics, NodeCategory } from "./types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAMPING = 0.85;
const PAGERANK_ITERATIONS = 30;
/** Minimum in-degree to qualify as a hub, regardless of percentile. */
const MIN_HUB_DEGREE = 3;

// ─── PageRank ─────────────────────────────────────────────────────────────────

/**
 * Simplified PageRank importance scoring.
 * Returns a score in [0, 1] for each node (normalised to max).
 *
 * PR(n) = (1-d)/N + d × Σ PR(m)/outDegree(m)  for m ∈ predecessors(n)
 */
export function computeImportance(
  nodes: Map<string, GraphNode>,
  reverseEdges: Map<string, Set<string>>,
  forwardEdges: Map<string, Set<string>>,
): Map<string, number> {
  const n = nodes.size;
  if (n === 0) return new Map();

  const keys = [...nodes.keys()];
  const scores = new Map<string, number>();
  const initScore = 1 / n;

  for (const k of keys) scores.set(k, initScore);

  for (let iter = 0; iter < PAGERANK_ITERATIONS; iter++) {
    const next = new Map<string, number>();
    const base = (1 - DAMPING) / n;

    for (const k of keys) {
      const predecessors = reverseEdges.get(k) ?? new Set<string>();
      let rank = base;

      for (const pred of predecessors) {
        const predScore = scores.get(pred) ?? 0;
        const predOut = forwardEdges.get(pred)?.size ?? 1;
        rank += DAMPING * (predScore / predOut);
      }

      next.set(k, rank);
    }

    for (const [k, v] of next) scores.set(k, v);
  }

  // Normalise to [0, 1] — avoid spread to prevent call-stack overflow on large maps
  let max = 1e-9;
  for (const v of scores.values()) {
    if (v > max) max = v;
  }
  for (const [k, v] of scores) scores.set(k, v / max);

  return scores;
}

// ─── Depth ────────────────────────────────────────────────────────────────────

/**
 * BFS from all entry points simultaneously.
 * Produces the minimum hop-distance from any entry point to each node.
 */
export function computeDepths(
  nodes: Map<string, GraphNode>,
  forwardEdges: Map<string, Set<string>>,
  entryPoints: Set<string>,
): Map<string, number> {
  const depths = new Map<string, number>();

  if (entryPoints.size === 0) {
    // Fully cyclic graph — no entry points exist; assign depth 0 to all
    for (const path of nodes.keys()) depths.set(path, 0);
    return depths;
  }

  const queue: string[] = [];
  for (const ep of entryPoints) {
    depths.set(ep, 0);
    queue.push(ep);
  }

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++]!;
    const currentDepth = depths.get(current) ?? 0;

    for (const neighbor of forwardEdges.get(current) ?? []) {
      if (!depths.has(neighbor)) {
        depths.set(neighbor, currentDepth + 1);
        queue.push(neighbor);
      }
    }
  }

  // Nodes unreachable from any entry point get max depth + 1
  let maxDepth = 0;
  for (const d of depths.values()) {
    if (d > maxDepth) maxDepth = d;
  }
  for (const path of nodes.keys()) {
    if (!depths.has(path)) depths.set(path, maxDepth + 1);
  }

  return depths;
}

// ─── Classification ───────────────────────────────────────────────────────────

/**
 * Returns the structural category for a single node.
 * `hubThreshold` should be computed as the 90th-percentile in-degree
 * (with a floor of MIN_HUB_DEGREE).
 */
export function categorizeNode(
  _path: string,
  node: GraphNode,
  inDegree: number,
  outDegree: number,
  hubThreshold: number,
): NodeCategory {
  if (node.isExternal) return "external";
  if (inDegree === 0 && outDegree === 0) return "isolated";
  if (node.isBarrel) return "barrel";
  if (inDegree === 0) return "entry";
  if (outDegree === 0) return "leaf";
  if (inDegree >= hubThreshold) return "hub";
  return "internal";
}

// ─── Entry point detection ────────────────────────────────────────────────────

/** Internal nodes with no incoming edges (potential dep-tree roots). */
export function findEntryPoints(
  nodes: Map<string, GraphNode>,
  reverseEdges: Map<string, Set<string>>,
): Set<string> {
  const entries = new Set<string>();
  for (const [path, node] of nodes) {
    if (node.isExternal) continue;
    if ((reverseEdges.get(path)?.size ?? 0) === 0) entries.add(path);
  }
  return entries;
}

// ─── Hub threshold ────────────────────────────────────────────────────────────

/**
 * 90th-percentile in-degree across internal nodes.
 * Floored at MIN_HUB_DEGREE so sparse graphs don't incorrectly classify
 * every node as a hub.
 */
export function computeHubThreshold(
  nodes: Map<string, GraphNode>,
  reverseEdges: Map<string, Set<string>>,
): number {
  const degrees: number[] = [];
  for (const [path, node] of nodes) {
    if (!node.isExternal) degrees.push(reverseEdges.get(path)?.size ?? 0);
  }
  return Math.max(MIN_HUB_DEGREE, percentile(degrees, 0.9));
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export function computeMetrics(
  nodes: Map<string, DependencyNode>,
  edges: DependencyEdge[],
  cycleCount: number,
): GraphMetrics {
  let internalNodes = 0;
  let externalNodes = 0;
  let totalIn = 0;
  let totalOut = 0;
  let maxDepth = 0;

  for (const node of nodes.values()) {
    if (node.isExternal) {
      externalNodes++;
    } else {
      internalNodes++;
      totalIn += node.inDegree;
      totalOut += node.outDegree;
      if (node.depth > maxDepth) maxDepth = node.depth;
    }
  }

  const valueEdges = edges.filter((e) => !e.isType).length;
  const typeEdges = edges.filter((e) => e.isType).length;
  const n = internalNodes;
  // Density: fraction of possible directed edges that exist
  const density = n > 1 ? edges.length / (n * (n - 1)) : 0;

  return {
    totalNodes: nodes.size,
    internalNodes,
    externalNodes,
    totalEdges: edges.length,
    valueEdges,
    typeEdges,
    cycleCount,
    maxDepth,
    avgInDegree: n > 0 ? totalIn / n : 0,
    avgOutDegree: n > 0 ? totalOut / n : 0,
    density,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)] ?? 0;
}
