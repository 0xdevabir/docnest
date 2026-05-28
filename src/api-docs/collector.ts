import path from "node:path";

import type { AnalysisResult, ApiFramework } from "../analyzer/types.js";
import type { RouteEntry } from "../analyzer/routes/types.js";
import type { CollectedRoute, RouteTag } from "./types.js";

export function collectRoutes(
  result: AnalysisResult,
  root: string,
): CollectedRoute[] {
  const collected: CollectedRoute[] = [];

  for (const [filePath, analysis] of result.files) {
    const routes = analysis.routes.routes;
    if (routes.length === 0) continue;

    const relativePath = path.relative(root, filePath);
    for (const entry of routes) {
      collected.push({ entry, filePath, relativePath });
    }
  }

  return collected;
}

export function inferPrimaryFramework(routes: CollectedRoute[]): ApiFramework {
  const counts = new Map<ApiFramework, number>();
  for (const { entry } of routes) {
    counts.set(entry.framework, (counts.get(entry.framework) ?? 0) + 1);
  }
  let best: ApiFramework = "unknown";
  let max = 0;
  for (const [fw, count] of counts) {
    if (count > max) {
      best = fw;
      max = count;
    }
  }
  return best;
}

export function groupByTag(routes: CollectedRoute[]): RouteTag[] {
  const tagMap = new Map<string, CollectedRoute[]>();

  for (const r of routes) {
    const tag = resolveTag(r);
    const existing = tagMap.get(tag) ?? [];
    existing.push(r);
    tagMap.set(tag, existing);
  }

  return [...tagMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, tagRoutes]) => ({
      name,
      routes: tagRoutes.sort(compareRoutes),
    }));
}

/**
 * Compute the full URL path for display.
 * Express stores the mount prefix in `groupPath` and the local path in `path`
 * separately; all other frameworks embed the full path in `path` already.
 */
export function displayPath(entry: RouteEntry): string {
  const { path: routePath, groupPath, framework } = entry;

  if (routePath === undefined) return "(dynamic)";

  if (
    framework === "express" &&
    groupPath !== undefined &&
    !routePath.startsWith(groupPath)
  ) {
    return normalizePath(`${groupPath}/${routePath}`);
  }

  return routePath;
}

// ---- private helpers ----

function resolveTag(r: CollectedRoute): string {
  const { entry } = r;

  if (entry.tags.length > 0) {
    const tag = entry.tags[0];
    if (tag !== undefined) return capitalize(tag.replace(/^\//, ""));
  }

  const dp = displayPath(entry);
  const firstReal = dp
    .split("/")
    .filter((s) => s.length > 0 && !s.startsWith(":") && !s.startsWith("["));

  const first = firstReal[0];
  return first !== undefined ? capitalize(first) : "General";
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function normalizePath(p: string): string {
  return p.replace(/\/{2,}/g, "/");
}

function compareRoutes(a: CollectedRoute, b: CollectedRoute): number {
  const pa = displayPath(a.entry);
  const pb = displayPath(b.entry);
  const cmp = pa.localeCompare(pb);
  if (cmp !== 0) return cmp;
  return methodPriority(a.entry.methods[0]) - methodPriority(b.entry.methods[0]);
}

const METHOD_ORDER: Record<string, number> = {
  GET: 0,
  POST: 1,
  PUT: 2,
  PATCH: 3,
  DELETE: 4,
  HEAD: 5,
  OPTIONS: 6,
  ALL: 7,
};

function methodPriority(m: string | undefined): number {
  return METHOD_ORDER[m ?? ""] ?? 99;
}
