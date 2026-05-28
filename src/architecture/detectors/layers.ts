import type { ArchEvidence, ArchLayer, LayerKind } from "../types.js";
import { winningVote, type FileSignals } from "../signals.js";

const LAYER_LABELS: Record<LayerKind, string> = {
  presentation: "Presentation",
  application: "Application",
  domain: "Domain",
  infrastructure: "Infrastructure",
  shared: "Shared / Utilities",
  unknown: "Unknown",
};

export function detectLayers(
  signals: Map<string, FileSignals>,
  minConfidence: number,
): ArchLayer[] {
  const layerFiles = new Map<LayerKind, string[]>();
  const layerConf = new Map<LayerKind, number[]>();

  for (const [path, fs] of signals) {
    const { winner, confidence } = winningVote<LayerKind>(fs.layerVotes, "unknown");
    const bucket = layerFiles.get(winner) ?? [];
    bucket.push(path);
    layerFiles.set(winner, bucket);

    const confs = layerConf.get(winner) ?? [];
    confs.push(confidence);
    layerConf.set(winner, confs);
  }

  const layers: ArchLayer[] = [];

  for (const [kind, files] of layerFiles) {
    if (files.length === 0) continue;

    const confs = layerConf.get(kind) ?? [];
    const avgConf = confs.reduce((a, b) => a + b, 0) / (confs.length || 1);
    if (avgConf < minConfidence && kind !== "unknown") continue;

    layers.push({
      kind,
      label: LAYER_LABELS[kind],
      files,
      confidence: avgConf,
      evidence: buildLayerEvidence(files, signals, kind),
    });
  }

  // Return in canonical layer order
  const ORDER: LayerKind[] = [
    "presentation",
    "application",
    "domain",
    "infrastructure",
    "shared",
    "unknown",
  ];
  return layers.sort(
    (a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind),
  );
}

function buildLayerEvidence(
  files: string[],
  signals: Map<string, FileSignals>,
  layer: LayerKind,
): ArchEvidence[] {
  const labelCounts = new Map<string, { count: number; sources: string[] }>();
  for (const path of files) {
    const fs = signals.get(path);
    if (fs === undefined) continue;
    for (const sig of fs.signals) {
      if (sig.impliedLayer !== layer) continue;
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
