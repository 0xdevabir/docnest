import type { AnalysisResult } from "../../analyzer/types.js";
import type { ArchEvidence, ArchZone, ZoneKind } from "../types.js";
import {
  collectAllSignals,
  winningVote,
  type FileSignals,
} from "../signals.js";

const ZONE_LABELS: Record<ZoneKind, string> = {
  frontend: "Frontend",
  backend: "Backend",
  api: "API Layer",
  shared: "Shared",
  config: "Config / Build",
  infrastructure: "Infrastructure",
  test: "Tests",
  unknown: "Unknown",
};

export function detectZones(
  result: AnalysisResult,
  signals: Map<string, FileSignals>,
  minConfidence: number,
): ArchZone[] {
  // ── Assign each file to a zone ─────────────────────────────────────────────
  const zoneFiles = new Map<ZoneKind, string[]>();
  const zoneConf = new Map<ZoneKind, number[]>();

  for (const [path, fs] of signals) {
    const { winner, confidence } = winningVote<ZoneKind>(fs.zoneVotes, "unknown");
    const bucket = zoneFiles.get(winner) ?? [];
    bucket.push(path);
    zoneFiles.set(winner, bucket);

    const confs = zoneConf.get(winner) ?? [];
    confs.push(confidence);
    zoneConf.set(winner, confs);
  }

  const zones: ArchZone[] = [];

  for (const [kind, files] of zoneFiles) {
    if (files.length === 0) continue;

    const confs = zoneConf.get(kind) ?? [];
    const avgConf = confs.reduce((a, b) => a + b, 0) / (confs.length || 1);
    if (avgConf < minConfidence && kind !== "unknown") continue;

    const evidence = buildZoneEvidence(files, signals, kind);
    const { cohesion, coupling } = computeZoneCohesionCoupling(
      files,
      zoneFiles,
      result,
    );

    zones.push({
      kind,
      label: ZONE_LABELS[kind],
      files,
      confidence: avgConf,
      evidence,
      cohesion,
      coupling,
    });
  }

  return zones.sort((a, b) => b.files.length - a.files.length);
}

// ── Evidence builder ───────────────────────────────────────────────────────────

function buildZoneEvidence(
  files: string[],
  signals: Map<string, FileSignals>,
  zone: ZoneKind,
): ArchEvidence[] {
  // Aggregate signal labels for this zone
  const labelCounts = new Map<string, { count: number; sources: string[] }>();
  for (const path of files) {
    const fs = signals.get(path);
    if (fs === undefined) continue;
    for (const sig of fs.signals) {
      if (sig.impliedZone !== zone) continue;
      const entry = labelCounts.get(sig.label) ?? { count: 0, sources: [] };
      entry.count++;
      if (!entry.sources.includes(path)) entry.sources.push(path);
      labelCounts.set(sig.label, entry);
    }
  }

  return [...labelCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([label, { count, sources }]) => ({
      description: `${label} (${count} file${count > 1 ? "s" : ""})`,
      sources: sources.slice(0, 3),
      weight: Math.min(1, count / files.length),
    }));
}

// ── Cohesion / coupling ────────────────────────────────────────────────────────

function computeZoneCohesionCoupling(
  zoneFilePaths: string[],
  allZones: Map<ZoneKind, string[]>,
  result: AnalysisResult,
): { cohesion: number; coupling: number } {
  const zoneSet = new Set(zoneFilePaths);
  let internalEdges = 0;
  let externalEdges = 0;

  for (const path of zoneFilePaths) {
    const deps = result.graph.edges.get(path);
    if (deps === undefined) continue;
    for (const dep of deps) {
      if (zoneSet.has(dep)) {
        internalEdges++;
      } else {
        // Only count as external if it's a project file (not external lib)
        const node = result.graph.nodes.get(dep);
        if (node !== undefined && !node.isExternal) externalEdges++;
      }
    }
  }

  const total = internalEdges + externalEdges;
  if (total === 0) return { cohesion: 1, coupling: 0 };
  return {
    cohesion: internalEdges / total,
    coupling: externalEdges / total,
  };
}
