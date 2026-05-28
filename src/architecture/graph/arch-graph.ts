import { posix } from "node:path";

import type { AnalysisResult } from "../../analyzer/types.js";
import type {
  ArchEdge,
  ArchitectureGraph,
  ArchLayer,
  ArchNode,
  ArchZone,
  DirectoryNode,
  FeatureBoundary,
  LayerKind,
  ProjectMap,
  ZoneKind,
} from "../types.js";

// ── Architecture graph ─────────────────────────────────────────────────────────

export function buildArchGraph(
  zones: ArchZone[],
  features: FeatureBoundary[],
  layers: ArchLayer[],
  result: AnalysisResult,
): ArchitectureGraph {
  const nodes = new Map<string, ArchNode>();
  const adjacency = new Map<string, Set<string>>();

  // ── Create nodes ───────────────────────────────────────────────────────────

  // Zone nodes
  for (const zone of zones) {
    const id = `zone:${zone.kind}`;
    nodes.set(id, {
      id,
      kind: "zone",
      label: zone.label,
      files: zone.files,
      zone: zone.kind,
      confidence: zone.confidence,
    });
  }

  // Feature nodes (more granular than zones)
  for (const feature of features) {
    const id = `feature:${feature.name}`;
    nodes.set(id, {
      id,
      kind: "feature",
      label: feature.name,
      files: feature.files,
      confidence: feature.confidence,
    });
  }

  // Layer nodes
  for (const layer of layers) {
    const id = `layer:${layer.kind}`;
    nodes.set(id, {
      id,
      kind: "layer",
      label: layer.label,
      files: layer.files,
      layer: layer.kind,
      confidence: layer.confidence,
    });
  }

  // ── Build file-to-node index ───────────────────────────────────────────────

  // Prefer feature-level resolution over zone-level
  const fileToNodeId = new Map<string, string>();
  for (const zone of zones) {
    for (const f of zone.files) fileToNodeId.set(f, `zone:${zone.kind}`);
  }
  for (const feature of features) {
    for (const f of feature.files) fileToNodeId.set(f, `feature:${feature.name}`);
  }

  // ── Count file-level edges between nodes ───────────────────────────────────

  const edgeCounts = new Map<string, { count: number; typeOnlyCount: number }>();

  for (const [fromFile, analysis] of result.files) {
    const fromNode = fileToNodeId.get(fromFile);
    if (fromNode === undefined) continue;

    for (const imp of analysis.imports) {
      const toFile = imp.resolvedPath;
      if (toFile === undefined) continue;
      const toNode = fileToNodeId.get(toFile);
      if (toNode === undefined || toNode === fromNode) continue;

      const key = `${fromNode}→${toNode}`;
      const entry = edgeCounts.get(key) ?? { count: 0, typeOnlyCount: 0 };
      entry.count++;
      if (imp.isType) entry.typeOnlyCount++;
      edgeCounts.set(key, entry);
    }
  }

  // ── Normalize and build ArchEdge[] ─────────────────────────────────────────

  const maxCount = Math.max(1, ...[...edgeCounts.values()].map((e) => e.count));
  const edges: ArchEdge[] = [];

  for (const [key, { count, typeOnlyCount }] of edgeCounts) {
    const [from, to] = key.split("→") as [string, string];
    edges.push({
      from,
      to,
      edgeCount: count,
      weight: count / maxCount,
      isTypeOnly: typeOnlyCount === count,
    });

    const adj = adjacency.get(from) ?? new Set();
    adj.add(to);
    adjacency.set(from, adj);
  }

  return { nodes, edges, adjacency };
}

// ── Project map ────────────────────────────────────────────────────────────────

export function buildProjectMap(
  result: AnalysisResult,
  zones: ArchZone[],
  layers: ArchLayer[],
  features: FeatureBoundary[],
  root: string,
): ProjectMap {
  // Build per-file maps for O(1) lookup
  const fileZone = new Map<string, ZoneKind>();
  const fileLayer = new Map<string, LayerKind>();

  for (const zone of zones) {
    for (const f of zone.files) fileZone.set(f, zone.kind);
  }
  for (const layer of layers) {
    for (const f of layer.files) fileLayer.set(f, layer.kind);
  }

  // ── Zone / layer maps ──────────────────────────────────────────────────────

  const zoneMap = new Map<ZoneKind, string[]>();
  for (const zone of zones) zoneMap.set(zone.kind, zone.files);

  const layerMap = new Map<LayerKind, string[]>();
  for (const layer of layers) layerMap.set(layer.kind, layer.files);

  // ── Directory tree ─────────────────────────────────────────────────────────

  const directories = buildDirTree(result, fileZone, fileLayer, root);

  // ── Core modules (already computed in service, passed in) ─────────────────

  return {
    directories,
    zones: zoneMap,
    layers: layerMap,
    features,
    coreModules: [], // filled by service after identifyCoreModules
  };
}

function buildDirTree(
  result: AnalysisResult,
  fileZone: Map<string, ZoneKind>,
  fileLayer: Map<string, LayerKind>,
  root: string,
): DirectoryNode[] {
  // Group files by their top-2 directory segments
  const dirFiles = new Map<string, string[]>();

  for (const path of result.files.keys()) {
    const rel = posix.relative(root, path);
    const segs = rel.split("/").filter(Boolean);
    if (segs.length === 0) continue;

    const topDir = segs.length === 1 ? "." : segs[0]!;
    const arr = dirFiles.get(topDir) ?? [];
    arr.push(path);
    dirFiles.set(topDir, arr);
  }

  const nodes: DirectoryNode[] = [];

  for (const [dir, files] of dirFiles) {
    const zones = files.map((f) => fileZone.get(f) ?? "unknown");
    const layers = files.map((f) => fileLayer.get(f) ?? "unknown");

    nodes.push({
      name: dir,
      relativePath: dir,
      zone: majorityVote(zones, "unknown" as ZoneKind),
      layer: majorityVote(layers, "unknown" as LayerKind),
      fileCount: files.length,
      children: buildSubDirs(files, fileZone, fileLayer, root, dir, 1),
      confidence: 0.7,
    });
  }

  return nodes.sort((a, b) => b.fileCount - a.fileCount);
}

function buildSubDirs(
  files: string[],
  fileZone: Map<string, ZoneKind>,
  fileLayer: Map<string, LayerKind>,
  root: string,
  parentDir: string,
  depth: number,
): DirectoryNode[] {
  if (depth >= 3 || files.length < 3) return [];

  const subDirFiles = new Map<string, string[]>();
  for (const path of files) {
    const rel = posix.relative(root, path);
    const segs = rel.split("/").filter(Boolean);
    if (segs.length <= depth + 1) continue;
    const subDir = segs[depth]!;
    const arr = subDirFiles.get(subDir) ?? [];
    arr.push(path);
    subDirFiles.set(subDir, arr);
  }

  const nodes: DirectoryNode[] = [];
  for (const [dir, subFiles] of subDirFiles) {
    const zones = subFiles.map((f) => fileZone.get(f) ?? "unknown");
    const layers = subFiles.map((f) => fileLayer.get(f) ?? "unknown");
    nodes.push({
      name: dir,
      relativePath: `${parentDir}/${dir}`,
      zone: majorityVote(zones, "unknown" as ZoneKind),
      layer: majorityVote(layers, "unknown" as LayerKind),
      fileCount: subFiles.length,
      children: buildSubDirs(subFiles, fileZone, fileLayer, root, `${parentDir}/${dir}`, depth + 1),
      confidence: 0.65,
    });
  }

  return nodes.sort((a, b) => b.fileCount - a.fileCount);
}

function majorityVote<T extends string>(values: T[], fallback: T): T {
  if (values.length === 0) return fallback;
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = fallback;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (v !== ("unknown" as T) && c > bestCount) {
      bestCount = c;
      best = v;
    }
  }
  return best;
}
