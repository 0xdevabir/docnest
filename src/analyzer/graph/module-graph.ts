import type {
  FileAnalysis,
  GraphEdge,
  GraphNode,
  ModuleGraph,
} from "../types.js";
import type { ModuleResolver } from "./resolver.js";

export function buildModuleGraph(
  analyses: Map<string, FileAnalysis>,
  resolver: ModuleResolver,
): ModuleGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, Set<string>>();
  const reverseEdges = new Map<string, Set<string>>();
  const edgeMeta = new Map<string, GraphEdge[]>();

  // ── Seed nodes from analysed files ────────────────────────────────────────
  for (const [path, analysis] of analyses) {
    nodes.set(path, {
      path,
      relativePath: analysis.relativePath,
      exports: analysis.exports.map((e) => e.name),
      isBarrel: analysis.isBarrelFile,
      isExternal: false,
    });
  }

  // ── Build edges ───────────────────────────────────────────────────────────
  for (const [fromPath, analysis] of analyses) {
    const fromEdges = getOrCreate(edges, fromPath, () => new Set());
    const fromMeta = getOrCreate(edgeMeta, fromPath, () => []);

    for (const imp of analysis.imports) {
      const toPath = imp.resolvedPath;
      if (toPath === undefined) continue;

      // Register external node on first encounter
      if (!nodes.has(toPath)) {
        nodes.set(toPath, {
          path: toPath,
          relativePath: imp.specifier,
          exports: [],
          isBarrel: false,
          isExternal: resolver.isExternal(toPath),
        });
      }

      fromEdges.add(toPath);

      fromMeta.push({
        from: fromPath,
        to: toPath,
        bindings: imp.bindings.map((b) => b.imported),
        isType: imp.isType,
      });

      const toRev = getOrCreate(reverseEdges, toPath, () => new Set<string>());
      toRev.add(fromPath);
    }

    // Re-export sources also count as edges
    for (const exp of analysis.exports) {
      const toPath = exp.resolvedSource;
      if (toPath === undefined) continue;

      if (!nodes.has(toPath)) {
        nodes.set(toPath, {
          path: toPath,
          relativePath: exp.source ?? toPath,
          exports: [],
          isBarrel: false,
          isExternal: resolver.isExternal(toPath),
        });
      }

      fromEdges.add(toPath);
      fromMeta.push({
        from: fromPath,
        to: toPath,
        bindings: exp.name === "*" ? ["*"] : [exp.name],
        isType: exp.isType,
      });

      const toRev = getOrCreate(reverseEdges, toPath, () => new Set<string>());
      toRev.add(fromPath);
    }
  }

  return { nodes, edges, reverseEdges, edgeMeta };
}

export function emptyGraph(): ModuleGraph {
  return {
    nodes: new Map(),
    edges: new Map(),
    reverseEdges: new Map(),
    edgeMeta: new Map(),
  };
}

/**
 * Returns all files that directly or transitively depend on `targetPath`.
 * Useful for finding the blast radius of a change.
 */
export function findConsumers(
  graph: ModuleGraph,
  targetPath: string,
  transitive = false,
): Set<string> {
  const direct = graph.reverseEdges.get(targetPath) ?? new Set<string>();
  if (!transitive) return new Set(direct);

  const visited = new Set<string>();
  const queue = [...direct];
  while (queue.length > 0) {
    const next = queue.shift();
    if (next === undefined || visited.has(next)) continue;
    visited.add(next);
    const upstream = graph.reverseEdges.get(next);
    if (upstream !== undefined) {
      for (const u of upstream) {
        if (!visited.has(u)) queue.push(u);
      }
    }
  }
  return visited;
}

/**
 * Detects circular dependency chains. Returns arrays of paths that form cycles.
 */
export function detectCycles(graph: ModuleGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart).concat(node));
      }
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);
    path.push(node);

    const deps = graph.edges.get(node);
    if (deps !== undefined) {
      for (const dep of deps) {
        dfs(dep);
      }
    }

    path.pop();
    stack.delete(node);
  }

  for (const node of graph.nodes.keys()) {
    dfs(node);
  }

  return cycles;
}

function getOrCreate<K, V>(map: Map<K, V>, key: K, factory: () => V): V {
  let val = map.get(key);
  if (val === undefined) {
    val = factory();
    map.set(key, val);
  }
  return val;
}
