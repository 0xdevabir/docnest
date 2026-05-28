import type { DependencyChain, DependencyGraph } from "./types.js";

// ─── Shortest path (BFS) ──────────────────────────────────────────────────────

/** BFS shortest hop-path from `from` to `to`. Returns undefined if unreachable. */
export function findShortestPath(
  graph: DependencyGraph,
  from: string,
  to: string,
): DependencyChain | undefined {
  if (!graph.nodes.has(from) || !graph.nodes.has(to)) return undefined;
  if (from === to) {
    return { from, to, path: [from], length: 0, containsCycle: false };
  }

  const prev = new Map<string, string>();
  const visited = new Set<string>([from]);
  const queue = [from];
  let head = 0;
  let found = false;

  outer: while (head < queue.length) {
    const current = queue[head++]!;
    for (const neighbor of graph.adjacency.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      prev.set(neighbor, current);
      if (neighbor === to) {
        found = true;
        break outer;
      }
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }

  if (!found) return undefined;

  // Reconstruct path back to `from`
  const path: string[] = [];
  let cur: string | undefined = to;
  while (cur !== undefined) {
    path.unshift(cur);
    cur = prev.get(cur);
  }

  return {
    from,
    to,
    path,
    length: path.length - 1,
    containsCycle: pathHasCycle(path, graph),
  };
}

// ─── All paths (bounded DFS) ──────────────────────────────────────────────────

export interface FindAllPathsOptions {
  /** Maximum hop depth per path (default: 10). */
  maxDepth?: number;
  /** Maximum number of paths to return (default: 50). */
  maxPaths?: number;
}

/**
 * Finds all simple paths from `from` to `to`.
 * Bounded by `maxDepth` and `maxPaths` to prevent combinatorial explosion
 * in densely connected graphs.
 */
export function findAllPaths(
  graph: DependencyGraph,
  from: string,
  to: string,
  options?: FindAllPathsOptions,
): DependencyChain[] {
  const maxDepth = options?.maxDepth ?? 10;
  const maxPaths = options?.maxPaths ?? 50;
  const results: DependencyChain[] = [];
  const onPath = new Set<string>();

  function dfs(current: string, path: string[]): void {
    if (results.length >= maxPaths || path.length > maxDepth + 1) return;

    if (current === to && path.length > 1) {
      results.push({
        from,
        to,
        path: [...path],
        length: path.length - 1,
        containsCycle: pathHasCycle(path, graph),
      });
      return;
    }

    onPath.add(current);
    for (const neighbor of graph.adjacency.get(current) ?? []) {
      if (!onPath.has(neighbor)) {
        path.push(neighbor);
        dfs(neighbor, path);
        path.pop();
      }
    }
    onPath.delete(current);
  }

  dfs(from, [from]);
  return results;
}

// ─── Topological sort ─────────────────────────────────────────────────────────

/**
 * Post-order DFS topological sort.
 * Handles cycles by skipping back-edges (nodes already on the current stack).
 * Returns a stable ordering suitable for build/dependency resolution.
 */
export function topologicalSort(graph: DependencyGraph): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const onStack = new Set<string>();

  function dfs(node: string): void {
    if (onStack.has(node) || visited.has(node)) return;

    onStack.add(node);
    for (const dep of graph.adjacency.get(node) ?? []) {
      dfs(dep);
    }
    onStack.delete(node);
    visited.add(node);
    sorted.push(node); // post-order
  }

  for (const node of graph.nodes.keys()) dfs(node);

  return sorted.reverse(); // reverse post-order = topological
}

// ─── Transitive reachability ──────────────────────────────────────────────────

/** All modules that `path` transitively depends on (BFS forward). */
export function transitiveDeps(
  graph: DependencyGraph,
  path: string,
): Set<string> {
  return bfsReachable(graph.adjacency, path, false);
}

/**
 * All modules that transitively depend on `path` — the blast radius of
 * a change (BFS reverse).
 */
export function transitiveConsumers(
  graph: DependencyGraph,
  path: string,
): Set<string> {
  return bfsReachable(graph.reverseAdjacency, path, false);
}

// ─── Longest chain ────────────────────────────────────────────────────────────

/**
 * Finds the longest simple path reachable from `from` via DFS.
 * Cycle-safe: revisiting a node already on the current path is skipped.
 * Returns undefined if `from` has no outgoing edges.
 */
export function longestChain(
  graph: DependencyGraph,
  from: string,
): DependencyChain | undefined {
  if (!graph.nodes.has(from)) return undefined;

  let longest: string[] = [from];
  const onPath = new Set<string>();

  function dfs(current: string, path: string[]): void {
    if (path.length > longest.length) longest = [...path];

    onPath.add(current);
    for (const dep of graph.adjacency.get(current) ?? []) {
      if (!onPath.has(dep)) {
        path.push(dep);
        dfs(dep, path);
        path.pop();
      }
    }
    onPath.delete(current);
  }

  dfs(from, [from]);

  if (longest.length <= 1) return undefined;

  const to = longest[longest.length - 1]!;
  return {
    from,
    to,
    path: longest,
    length: longest.length - 1,
    containsCycle: pathHasCycle(longest, graph),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bfsReachable(
  adjacency: Map<string, Set<string>>,
  start: string,
  includeSelf: boolean,
): Set<string> {
  const visited = new Set<string>();
  const queue = [start];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++]!;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  if (!includeSelf) visited.delete(start);
  return visited;
}

function pathHasCycle(path: string[], graph: DependencyGraph): boolean {
  return path.some((p) => (graph.nodes.get(p)?.cycleIds.length ?? 0) > 0);
}
