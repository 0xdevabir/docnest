import type { ModuleGraph } from "../../analyzer/types.js";

/**
 * Graph-level clustering utilities.
 *
 * Primary algorithm: directory-based grouping (fast, interpretable).
 * Refinement: import-density scoring (detects cohesion/coupling).
 */

// ── Cohesion / coupling ────────────────────────────────────────────────────────

export function computeCohesion(
  filePaths: Set<string>,
  graph: ModuleGraph,
): number {
  if (filePaths.size <= 1) return 1;
  let internal = 0;
  let total = 0;

  for (const path of filePaths) {
    const deps = graph.edges.get(path);
    if (deps === undefined) continue;
    for (const dep of deps) {
      const node = graph.nodes.get(dep);
      if (node?.isExternal) continue;
      total++;
      if (filePaths.has(dep)) internal++;
    }
  }

  return total === 0 ? 0 : internal / total;
}

export function computeCoupling(
  filePaths: Set<string>,
  graph: ModuleGraph,
): number {
  if (filePaths.size === 0) return 0;
  let external = 0;
  let total = 0;

  for (const path of filePaths) {
    const deps = graph.edges.get(path);
    if (deps === undefined) continue;
    for (const dep of deps) {
      const node = graph.nodes.get(dep);
      if (node?.isExternal) continue;
      total++;
      if (!filePaths.has(dep)) external++;
    }
  }

  return total === 0 ? 0 : external / total;
}

/**
 * Finds strongly connected components using Tarjan's algorithm.
 * Useful for detecting tightly coupled module clusters that should
 * be treated as a single architectural unit.
 */
export function findStronglyConnectedComponents(
  graph: ModuleGraph,
): string[][] {
  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Map<string, boolean>();
  const stack: string[] = [];
  const sccs: string[][] = [];
  let counter = 0;

  function strongConnect(v: string): void {
    index.set(v, counter);
    lowlink.set(v, counter);
    counter++;
    stack.push(v);
    onStack.set(v, true);

    const deps = graph.edges.get(v);
    if (deps !== undefined) {
      for (const w of deps) {
        if (!graph.nodes.has(w) || graph.nodes.get(w)?.isExternal) continue;
        if (!index.has(w)) {
          strongConnect(w);
          lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
        } else if (onStack.get(w)) {
          lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
        }
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.set(w, false);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) sccs.push(scc); // only non-trivial SCCs
    }
  }

  for (const node of graph.nodes.keys()) {
    if (!graph.nodes.get(node)?.isExternal && !index.has(node)) {
      strongConnect(node);
    }
  }

  return sccs;
}

/**
 * Computes PageRank-like centrality scores for all internal nodes.
 * High-centrality nodes are core modules.
 */
export function computeNodeCentrality(
  graph: ModuleGraph,
  iterations = 20,
  damping = 0.85,
): Map<string, number> {
  const internalNodes = [...graph.nodes.entries()]
    .filter(([, n]) => !n.isExternal)
    .map(([k]) => k);

  if (internalNodes.length === 0) return new Map();

  const N = internalNodes.length;
  const scores = new Map<string, number>();
  for (const n of internalNodes) scores.set(n, 1 / N);

  for (let iter = 0; iter < iterations; iter++) {
    const newScores = new Map<string, number>();
    for (const n of internalNodes) newScores.set(n, (1 - damping) / N);

    for (const n of internalNodes) {
      const rev = graph.reverseEdges.get(n);
      if (rev === undefined) continue;
      for (const from of rev) {
        const fromDeps = graph.edges.get(from)?.size ?? 1;
        const prev = newScores.get(n) ?? 0;
        newScores.set(n, prev + damping * (scores.get(from) ?? 0) / fromDeps);
      }
    }

    for (const [k, v] of newScores) scores.set(k, v);
  }

  return scores;
}
