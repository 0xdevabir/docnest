import { posix } from "node:path";

import type { AnalysisResult, FileAnalysis, ModuleGraph } from "../../analyzer/types.js";
import type { ArchEvidence, FeatureBoundary } from "../types.js";

/** Top-level directories that directly contain feature sub-directories. */
const FEATURE_HUBS = new Set([
  "src", "app", "features", "modules", "packages", "libs", "domains",
  "apps", "services", "lib",
]);

/** Directories that are cross-cutting concerns — never treated as features. */
const NON_FEATURE_DIRS = new Set([
  "shared", "common", "utils", "util", "helpers", "lib", "libs",
  "types", "constants", "config", "configs", "assets", "public",
  "static", "__tests__", "tests", "test", "e2e", "node_modules",
  ".next", "dist", "build", "out",
]);

export function detectFeatures(
  result: AnalysisResult,
  root: string,
  minConfidence: number,
): FeatureBoundary[] {
  const relativePaths = [...result.files.keys()].map((p) =>
    posix.relative(root, p),
  );

  // ── Step 1: Cluster by directory ──────────────────────────────────────────
  const clusters = clusterByDirectory(relativePaths, root);
  if (clusters.size === 0) return [];

  // ── Step 2: Score each cluster ────────────────────────────────────────────
  const features: FeatureBoundary[] = [];

  for (const [dirKey, relPaths] of clusters) {
    if (relPaths.length < 2) continue;

    const absPaths = relPaths.map((r) => posix.join(root, r));
    const absSet = new Set(absPaths);

    const cohesion = computeCohesion(absSet, result.graph);
    const confidence = scoreFeatureConfidence(dirKey, relPaths, cohesion);
    if (confidence < minConfidence) continue;

    const featureName = nameFromDir(dirKey);
    const publicApi = extractPublicApi(absPaths, result);
    const deps = findFeatureDependencies(absPaths, clusters, root, result);
    const evidence = buildFeatureEvidence(dirKey, relPaths, cohesion);

    features.push({
      name: featureName,
      rootDir: dirKey,
      files: absPaths,
      publicApi,
      dependencies: deps,
      confidence,
      evidence,
      cohesion,
    });
  }

  // ── Step 3: Sort by file count and remove duplicates ──────────────────────
  return deduplicateFeatures(features).sort(
    (a, b) => b.files.length - a.files.length,
  );
}

// ── Directory clustering ───────────────────────────────────────────────────────

function clusterByDirectory(
  relativePaths: string[],
  root: string,
): Map<string, string[]> {
  const clusters = new Map<string, string[]>();

  // Count files per directory at each depth
  const dirDepth = new Map<string, number>();
  for (const rel of relativePaths) {
    const segs = rel.split("/").filter(Boolean);
    for (let d = 1; d <= segs.length - 1; d++) {
      const prefix = segs.slice(0, d).join("/");
      dirDepth.set(prefix, (dirDepth.get(prefix) ?? 0) + 1);
    }
  }

  // Identify feature root directories
  const featureRoots = findFeatureRoots(dirDepth);

  // Assign each file to its nearest (deepest) feature root
  for (const rel of relativePaths) {
    let bestRoot = "";
    let bestLen = 0;
    for (const root of featureRoots) {
      if (rel.startsWith(root + "/") && root.length > bestLen) {
        bestRoot = root;
        bestLen = root.length;
      }
    }
    if (bestRoot.length > 0) {
      const arr = clusters.get(bestRoot) ?? [];
      arr.push(rel);
      clusters.set(bestRoot, arr);
    }
  }

  return clusters;
}

function findFeatureRoots(dirDepth: Map<string, number>): Set<string> {
  const roots = new Set<string>();

  for (const [dir, count] of dirDepth) {
    if (count < 2) continue; // skip tiny dirs
    const segs = dir.split("/").filter(Boolean);
    if (segs.length === 0) continue;

    const last = segs[segs.length - 1]!.toLowerCase();
    if (NON_FEATURE_DIRS.has(last)) continue;

    // Depth-1 directories under known hubs
    if (segs.length === 1 && !FEATURE_HUBS.has(last)) {
      roots.add(dir);
      continue;
    }

    // Depth-2: parent must be a hub
    if (segs.length === 2) {
      const parent = segs[0]!.toLowerCase();
      if (FEATURE_HUBS.has(parent) && !NON_FEATURE_DIRS.has(last)) {
        roots.add(dir);
        continue;
      }
    }

    // Depth-3: grandparent is hub, parent is "features"/"modules" etc.
    if (segs.length === 3) {
      const grandparent = segs[0]!.toLowerCase();
      const parent = segs[1]!.toLowerCase();
      if (
        FEATURE_HUBS.has(grandparent) &&
        FEATURE_HUBS.has(parent) &&
        !NON_FEATURE_DIRS.has(last)
      ) {
        roots.add(dir);
      }
    }
  }

  // Remove roots that are sub-paths of another root (keep the deeper one)
  const toRemove = new Set<string>();
  for (const r of roots) {
    for (const other of roots) {
      if (other !== r && r.startsWith(other + "/")) {
        toRemove.add(other);
      }
    }
  }
  for (const r of toRemove) roots.delete(r);

  return roots;
}

// ── Cohesion scoring ───────────────────────────────────────────────────────────

function computeCohesion(absFiles: Set<string>, graph: ModuleGraph): number {
  if (absFiles.size <= 1) return 1;
  let internal = 0;
  let total = 0;
  for (const path of absFiles) {
    const deps = graph.edges.get(path);
    if (deps === undefined) continue;
    for (const dep of deps) {
      const node = graph.nodes.get(dep);
      if (node?.isExternal) continue;
      total++;
      if (absFiles.has(dep)) internal++;
    }
  }
  return total === 0 ? 0.5 : internal / total;
}

function scoreFeatureConfidence(
  dirKey: string,
  relPaths: string[],
  cohesion: number,
): number {
  let score = 0;

  // More files → higher base confidence
  score += Math.min(0.4, relPaths.length / 20);

  // Good cohesion
  score += cohesion * 0.4;

  // Has an index/barrel file at the root
  const hasBarrel = relPaths.some((p) => {
    const file = p.split("/").pop() ?? "";
    return /^index\.(ts|tsx|js|jsx)$/.test(file);
  });
  if (hasBarrel) score += 0.2;

  return Math.min(1, score);
}

// ── Public API extraction ──────────────────────────────────────────────────────

function extractPublicApi(
  absPaths: string[],
  result: AnalysisResult,
): string[] {
  // The public API is the barrel file's exports, or all exports from index files
  const api: string[] = [];
  for (const path of absPaths) {
    const analysis = result.files.get(path);
    if (analysis === undefined) continue;
    const file = path.split("/").pop() ?? "";
    if (/^index\.(ts|tsx|js|jsx)$/.test(file) || analysis.isBarrelFile) {
      for (const exp of analysis.exports) {
        if (exp.name !== "default" && !api.includes(exp.name)) {
          api.push(exp.name);
        }
      }
    }
  }
  return api.slice(0, 30); // cap for readability
}

// ── Feature dependency detection ───────────────────────────────────────────────

function findFeatureDependencies(
  absPaths: string[],
  allClusters: Map<string, string[]>,
  root: string,
  result: AnalysisResult,
): string[] {
  const absSet = new Set(absPaths);
  const depFeatures = new Set<string>();

  // Build reverse map: path → feature name
  const pathToFeature = new Map<string, string>();
  for (const [dir, relPaths] of allClusters) {
    for (const rel of relPaths) {
      pathToFeature.set(posix.join(root, rel), nameFromDir(dir));
    }
  }

  for (const path of absPaths) {
    const deps = result.graph.edges.get(path);
    if (deps === undefined) continue;
    for (const dep of deps) {
      if (absSet.has(dep)) continue; // internal
      const feat = pathToFeature.get(dep);
      if (feat !== undefined) depFeatures.add(feat);
    }
  }

  return [...depFeatures];
}

// ── Naming ─────────────────────────────────────────────────────────────────────

function nameFromDir(dirPath: string): string {
  const segs = dirPath.split("/").filter(Boolean);
  const last = segs[segs.length - 1] ?? dirPath;
  // kebab-case / snake_case → Title Case
  return last
    .split(/[-_]/)
    .map((s) => (s[0]?.toUpperCase() ?? "") + s.slice(1))
    .join(" ");
}

// ── Evidence ───────────────────────────────────────────────────────────────────

function buildFeatureEvidence(
  dirKey: string,
  relPaths: string[],
  cohesion: number,
): ArchEvidence[] {
  const evidence: ArchEvidence[] = [
    {
      description: `${relPaths.length} files under ${dirKey}/`,
      sources: [],
      weight: Math.min(1, relPaths.length / 10),
    },
    {
      description: `internal import cohesion: ${(cohesion * 100).toFixed(0)}%`,
      sources: [],
      weight: cohesion,
    },
  ];
  const hasBarrel = relPaths.some((p) => /\/index\.(ts|tsx|js|jsx)$/.test("/" + p));
  if (hasBarrel) {
    evidence.push({
      description: "has barrel/index file",
      sources: [],
      weight: 0.8,
    });
  }
  return evidence;
}

// ── Deduplication ──────────────────────────────────────────────────────────────

function deduplicateFeatures(features: FeatureBoundary[]): FeatureBoundary[] {
  // Remove any feature whose files are a strict subset of another feature
  const result: FeatureBoundary[] = [];
  for (const f of features) {
    const fSet = new Set(f.files);
    const isSubset = features.some(
      (other) =>
        other !== f &&
        other.files.length > f.files.length &&
        f.files.every((p) => new Set(other.files).has(p)),
    );
    if (!isSubset) result.push(f);
  }
  return result;
}
