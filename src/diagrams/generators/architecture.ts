import type { ArchNode, ZoneKind } from "../../architecture/types.js";
import type { DiagramContext, DiagramResult } from "../types.js";
import { mermaidFence, mId } from "../utils.js";

const ZONE_FILL: Record<ZoneKind, string> = {
  frontend:       "fill:#dbeafe,stroke:#3b82f6",
  backend:        "fill:#dcfce7,stroke:#22c55e",
  api:            "fill:#fce7f3,stroke:#ec4899",
  shared:         "fill:#fef9c3,stroke:#eab308",
  config:         "fill:#f3f4f6,stroke:#6b7280",
  infrastructure: "fill:#ede9fe,stroke:#8b5cf6",
  test:           "fill:#fff7ed,stroke:#f97316",
  unknown:        "fill:#f9fafb,stroke:#9ca3af",
};

export function generateArchitectureDiagram(ctx: DiagramContext): DiagramResult | null {
  const { archMap, options } = ctx;
  if (archMap === undefined) return null;

  const dir = options.direction ?? "TD";
  const minConf = options.minConfidence ?? 0.25;
  const archGraph = archMap.graph;

  const visibleNodes = [...archGraph.nodes.values()].filter(
    (n) => n.confidence >= minConf,
  );
  if (visibleNodes.length === 0) return null;

  const lines: string[] = [`graph ${dir}`];

  // Group nodes by zone for subgraph rendering
  const zoneGroups = new Map<string, ArchNode[]>();
  const standaloneNodes: ArchNode[] = [];

  for (const node of visibleNodes) {
    if (node.zone !== undefined) {
      const arr = zoneGroups.get(node.zone) ?? [];
      arr.push(node);
      zoneGroups.set(node.zone, arr);
    } else {
      standaloneNodes.push(node);
    }
  }

  for (const [zone, nodes] of zoneGroups) {
    const zoneId = mId(`zone_${zone}`);
    const zoneLabel = capitalize(zone) + " Zone";
    lines.push(`  subgraph ${zoneId}["${zoneLabel}"]`);
    for (const n of nodes.slice(0, 10)) {
      lines.push(`    ${nodeDecl(n)}`);
    }
    lines.push("  end");
  }

  for (const n of standaloneNodes.slice(0, 15)) {
    lines.push(`  ${nodeDecl(n)}`);
  }

  // Edges from the ArchitectureGraph
  const seenEdges = new Set<string>();
  for (const edge of archGraph.edges) {
    const fromNode = archGraph.nodes.get(edge.from);
    const toNode = archGraph.nodes.get(edge.to);
    if (
      fromNode === undefined ||
      toNode === undefined ||
      fromNode.confidence < minConf ||
      toNode.confidence < minConf
    ) continue;

    const key = `${mId(edge.from)}→${mId(edge.to)}`;
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);

    const arrow = edge.isTypeOnly ? "-.->" : "-->";
    const label = edge.edgeCount > 1 ? `|"${edge.edgeCount}"| ` : "";
    lines.push(`  ${mId(edge.from)} ${arrow}${label}${mId(edge.to)}`);
  }

  // Apply zone subgraph fill styles
  for (const zone of zoneGroups.keys()) {
    const style = ZONE_FILL[zone as ZoneKind];
    if (style !== undefined) {
      lines.push(`  style ${mId(`zone_${zone}`)} ${style}`);
    }
  }

  const mermaid = lines.join("\n");
  return {
    type: "architecture",
    title: "Architecture Overview",
    mermaid,
    markdown: mermaidFence(mermaid),
  };
}

function nodeDecl(node: ArchNode): string {
  const id = mId(node.id);
  const label = esc(node.label);
  switch (node.kind) {
    case "zone":        return `${id}(["${label}"])`;
    case "layer":       return `${id}(("${label}"))`;
    case "core-module": return `${id}{{"${label}"}}`;
    default:            return `${id}["${label}"]`;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function esc(s: string): string {
  return s.replace(/"/g, "'").replace(/[<>]/g, "");
}
