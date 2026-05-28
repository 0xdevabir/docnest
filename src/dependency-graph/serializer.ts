import type {
  D3Graph,
  D3Link,
  D3Node,
  DependencyGraph,
  DependencyNode,
  MermaidEdge,
  MermaidGraph,
  MermaidNode,
  MermaidOptions,
  MermaidSubgraph,
  NodeCategory,
  SerializedGraph,
} from "./types.js";

// ─── JSON / Structured ────────────────────────────────────────────────────────

/** Full JSON-serializable snapshot of the dependency graph. */
export function serializeGraph(
  graph: DependencyGraph,
  root: string,
): SerializedGraph {
  return {
    version: "1",
    generatedAt: new Date().toISOString(),
    root,
    metrics: graph.metrics,
    nodes: [...graph.nodes.values()].map((n) => ({
      id: n.path,
      relativePath: n.relativePath,
      exports: n.exports,
      isBarrel: n.isBarrel,
      isExternal: n.isExternal,
      inDegree: n.inDegree,
      outDegree: n.outDegree,
      importance: n.importance,
      depth: n.depth,
      category: n.category,
      cycleIds: n.cycleIds,
    })),
    edges: graph.edges.map((e) => ({ ...e })),
    cycles: graph.cycles,
  };
}

// ─── Mermaid ──────────────────────────────────────────────────────────────────

/**
 * Produces a structured Mermaid graph ready for `toMermaidString`.
 * Large graphs are trimmed to `maxNodes` by dropping least-important nodes first.
 */
export function toMermaid(
  graph: DependencyGraph,
  options: MermaidOptions = {},
): MermaidGraph {
  const {
    direction = "LR",
    maxNodes = 200,
    internalOnly = true,
    highlightCycles = true,
    groupByDirectory = true,
    minImportance = 0,
  } = options;

  // Filter candidates
  let candidates = [...graph.nodes.values()].filter((n) => {
    if (internalOnly && n.isExternal) return false;
    if (n.importance < minImportance) return false;
    return true;
  });

  // Trim to maxNodes by importance descending
  if (candidates.length > maxNodes) {
    candidates = candidates
      .sort((a, b) => b.importance - a.importance)
      .slice(0, maxNodes);
  }

  const included = new Set(candidates.map((n) => n.path));

  const mNodes: MermaidNode[] = candidates.map((n) => {
    const hasCycle = highlightCycles && n.cycleIds.length > 0;
    return {
      id: mermaidId(n.relativePath),
      label: shortLabel(n.relativePath),
      shape: nodeShape(n),
      ...(hasCycle && { style: "fill:#ffcccc,stroke:#cc0000,color:#000" }),
    };
  });

  const mEdges: MermaidEdge[] = graph.edges
    .filter((e) => included.has(e.from) && included.has(e.to))
    .map((e) => ({
      from: mermaidId(graph.nodes.get(e.from)!.relativePath),
      to: mermaidId(graph.nodes.get(e.to)!.relativePath),
      style: e.isType ? "dashed" : "solid",
    }));

  // Deduplicate edges (multiple parallel edges → single visual edge)
  const seenEdges = new Set<string>();
  const dedupedEdges = mEdges.filter((e) => {
    const key = `${e.from}→${e.to}`;
    if (seenEdges.has(key)) return false;
    seenEdges.add(key);
    return true;
  });

  const subgraphs: MermaidSubgraph[] = [];
  if (groupByDirectory) {
    const dirMap = new Map<string, string[]>();
    for (const n of candidates) {
      if (n.isExternal) continue;
      const segments = n.relativePath.split("/");
      const dir = segments.length > 1 ? (segments[0] ?? ".") : ".";
      const arr = dirMap.get(dir) ?? [];
      arr.push(mermaidId(n.relativePath));
      dirMap.set(dir, arr);
    }
    for (const [dir, nodeIds] of dirMap) {
      if (nodeIds.length > 1) {
        subgraphs.push({ id: mermaidId(dir), label: dir, nodeIds });
      }
    }
  }

  return { direction, nodes: mNodes, edges: dedupedEdges, subgraphs };
}

/**
 * Renders a `MermaidGraph` to a Mermaid diagram string.
 *
 * @example
 * ```
 * const str = toMermaidString(toMermaid(depGraph));
 * // paste into https://mermaid.live
 * ```
 */
export function toMermaidString(mermaid: MermaidGraph): string {
  const lines: string[] = [`graph ${mermaid.direction}`];

  // Track which nodes are placed inside subgraphs
  const inSubgraph = new Set<string>();

  for (const sg of mermaid.subgraphs) {
    lines.push(`  subgraph ${sg.id}["${sg.label}"]`);
    for (const nodeId of sg.nodeIds) {
      const node = mermaid.nodes.find((n) => n.id === nodeId);
      if (node !== undefined) {
        lines.push(`    ${formatNode(node)}`);
        inSubgraph.add(nodeId);
      }
    }
    lines.push("  end");
  }

  // Nodes not inside any subgraph
  for (const node of mermaid.nodes) {
    if (!inSubgraph.has(node.id)) {
      lines.push(`  ${formatNode(node)}`);
    }
  }

  // Edges
  for (const edge of mermaid.edges) {
    const arrow = edge.style === "dashed" ? "-.->" : "-->";
    const label = edge.label !== undefined ? `|${edge.label}|` : "";
    lines.push(`  ${edge.from} ${arrow}${label} ${edge.to}`);
  }

  // Per-node style overrides
  for (const node of mermaid.nodes) {
    if (node.style !== undefined) {
      lines.push(`  style ${node.id} ${node.style}`);
    }
  }

  return lines.join("\n");
}

// ─── D3 ───────────────────────────────────────────────────────────────────────

/**
 * D3 force-directed graph format.
 * `nodes[].group` maps to NodeCategory for colour grouping.
 * `links[].value` is the normalised edge weight [0, 1].
 */
export function toD3(graph: DependencyGraph): D3Graph {
  const nodes: D3Node[] = [...graph.nodes.values()].map((n) => ({
    id: n.path,
    label: n.relativePath,
    group: n.category,
    importance: n.importance,
    inDegree: n.inDegree,
    outDegree: n.outDegree,
    isExternal: n.isExternal,
  }));

  const links: D3Link[] = graph.edges.map((e) => ({
    source: e.from,
    target: e.to,
    value: e.weight,
    isType: e.isType,
    kind: e.kind,
  }));

  return { nodes, links };
}

// ─── Graphviz DOT ─────────────────────────────────────────────────────────────

export interface DotOptions {
  title?: string;
  /** Exclude external package nodes (default: true). */
  internalOnly?: boolean;
}

/** Renders the graph as a Graphviz DOT string for `dot -Tsvg` or `dot -Tpng`. */
export function toDot(graph: DependencyGraph, options: DotOptions = {}): string {
  const { title = "DependencyGraph", internalOnly = true } = options;

  const lines: string[] = [
    `digraph "${escapeDotString(title)}" {`,
    "  rankdir=LR;",
    '  node [shape=box, style=filled, fontname="Arial", fontsize=11];',
    '  edge [fontname="Arial", fontsize=9];',
    "",
  ];

  for (const node of graph.nodes.values()) {
    if (internalOnly && node.isExternal) continue;
    const color = dotColor(node.category);
    const label = escapeDotString(shortLabel(node.relativePath));
    lines.push(`  ${dotId(node.path)} [label="${label}", fillcolor="${color}"];`);
  }

  lines.push("");

  for (const edge of graph.edges) {
    const fromNode = graph.nodes.get(edge.from);
    const toNode = graph.nodes.get(edge.to);
    if (internalOnly && (fromNode?.isExternal === true || toNode?.isExternal === true)) continue;
    const attrs = edge.isType ? ' [style=dashed, color="#888888"]' : "";
    lines.push(`  ${dotId(edge.from)} -> ${dotId(edge.to)}${attrs};`);
  }

  lines.push("}");
  return lines.join("\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitise a relative path into a valid Mermaid node identifier. */
function mermaidId(relativePath: string): string {
  return relativePath
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/^_+/, "N_");
}

function shortLabel(relativePath: string): string {
  const parts = relativePath.split("/");
  return parts[parts.length - 1] ?? relativePath;
}

function nodeShape(node: DependencyNode): MermaidNode["shape"] {
  switch (node.category) {
    case "entry":   return "diamond";
    case "hub":     return "hexagon";
    case "barrel":  return "rounded";
    default:        return "rect";
  }
}

function formatNode(node: MermaidNode): string {
  switch (node.shape) {
    case "rounded":  return `${node.id}("${node.label}")`;
    case "diamond":  return `${node.id}{"${node.label}"}`;
    case "hexagon":  return `${node.id}{{"${node.label}"}}`;
    default:         return `${node.id}["${node.label}"]`;
  }
}

function dotId(path: string): string {
  const safe = path.replace(/\\/g, "/").replace(/"/g, '\\"');
  return `"${safe}"`;
}

function escapeDotString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const DOT_COLORS: Record<NodeCategory, string> = {
  entry:    "#d4f1f9",
  hub:      "#ffd700",
  barrel:   "#d5e8d4",
  external: "#f5f5f5",
  leaf:     "#ffe6cc",
  isolated: "#e1d5e7",
  internal: "#dae8fc",
};

function dotColor(category: NodeCategory): string {
  return DOT_COLORS[category] ?? "#ffffff";
}
