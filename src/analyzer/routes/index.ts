/**
 * Route Analysis Orchestrator
 *
 * Entry point for the route analysis subsystem. Given a parsed TypeScript
 * SourceFile, its absolute path, and the resolved import list, this module:
 *
 * 1. Runs framework-specific detectors (Next.js, Express, Hono, Fastify).
 * 2. Merges their results into a unified RouteAnalysis.
 * 3. Derives RouteGroups from declared router mounts and path prefix heuristics.
 *
 * Design principles:
 * - Each detector is import-gated: it does a cheap import-list check and bails
 *   early if the framework is not present. This keeps the common-path fast.
 * - Next.js is detected from the file path, not imports, so it runs first and
 *   exits early (App Router files have no framework import to check).
 * - Groups from different detectors are merged; duplicate prefixes are coalesced.
 */

import ts from "typescript";

import type { ApiFramework, ImportEntry } from "../types.js";
import { detectNextjsRoutes } from "./detectors/nextjs.js";
import { detectExpressRoutes } from "./detectors/express.js";
import { detectHonoRoutes } from "./detectors/hono.js";
import { detectFastifyRoutes } from "./detectors/fastify.js";
import type { RouteAnalysis, RouteEntry, RouteGroup } from "./types.js";

export function analyzeRoutes(
  sf: ts.SourceFile,
  filePath: string,
  imports: ImportEntry[],
): RouteAnalysis {
  // Next.js: path-based detection, mutually exclusive with call-based frameworks
  const nextjsRoutes = detectNextjsRoutes(sf, filePath);
  if (nextjsRoutes.length > 0) {
    const framework: ApiFramework = nextjsRoutes[0]?.framework ?? "nextjs-app";
    return { framework, routes: nextjsRoutes, groups: [] };
  }

  // Call-based frameworks: can coexist in monorepo files (rare but handled)
  const express = detectExpressRoutes(sf, imports);
  const hono = detectHonoRoutes(sf, imports);
  const fastify = detectFastifyRoutes(sf, imports);

  const routes: RouteEntry[] = [
    ...express.routes,
    ...hono.routes,
    ...fastify.routes,
  ];

  const rawGroups: RouteGroup[] = [
    ...express.groups,
    ...hono.groups,
    ...fastify.groups,
  ];

  if (routes.length === 0 && rawGroups.length === 0) {
    return { framework: "unknown", routes: [], groups: [] };
  }

  // Derive heuristic groups for ungrouped routes (first path segment)
  const heuristicGroups = deriveHeuristicGroups(
    routes.filter((r) => r.groupPath === undefined),
  );

  const groups = coalesceGroups([...rawGroups, ...heuristicGroups]);
  const framework = inferPrimaryFramework(routes);

  return { framework, routes, groups };
}

// ── Group helpers ─────────────────────────────────────────────────────────────

/**
 * Group routes by their first non-trivial path segment when no explicit
 * router mount was detected. Only creates a group when 2+ routes share the
 * same prefix — single-route prefixes are not worth grouping.
 */
function deriveHeuristicGroups(routes: RouteEntry[]): RouteGroup[] {
  const prefixMap = new Map<string, RouteEntry[]>();

  for (const route of routes) {
    if (route.path === undefined) continue;
    const prefix = firstSegment(route.path);
    if (prefix === "/") continue; // root-level — skip
    const existing = prefixMap.get(prefix) ?? [];
    existing.push(route);
    prefixMap.set(prefix, existing);
  }

  return [...prefixMap.entries()]
    .filter(([, members]) => members.length >= 2)
    .map(([prefix, members]) => ({
      prefix,
      middleware: [],
      routes: members,
      nested: [],
    }));
}

/** Merge duplicate-prefix groups produced by different detectors. */
function coalesceGroups(groups: RouteGroup[]): RouteGroup[] {
  const map = new Map<string, RouteGroup>();

  for (const g of groups) {
    const existing = map.get(g.prefix);
    if (existing === undefined) {
      map.set(g.prefix, { ...g });
    } else {
      existing.routes = deduplicateRoutes([...existing.routes, ...g.routes]);
      existing.middleware = [...existing.middleware, ...g.middleware];
      existing.nested = [...existing.nested, ...g.nested];
    }
  }

  return [...map.values()];
}

function deduplicateRoutes(routes: RouteEntry[]): RouteEntry[] {
  const seen = new Set<string>();
  return routes.filter((r) => {
    const key = `${r.path ?? ""}:${r.methods.join(",")}:${r.handler}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Framework inference ───────────────────────────────────────────────────────

function inferPrimaryFramework(routes: RouteEntry[]): ApiFramework {
  const counts = new Map<ApiFramework, number>();
  for (const r of routes) {
    counts.set(r.framework, (counts.get(r.framework) ?? 0) + 1);
  }
  let best: ApiFramework = "unknown";
  let max = 0;
  for (const [fw, count] of counts) {
    if (count > max) { best = fw; max = count; }
  }
  return best;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function firstSegment(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[0] !== undefined ? `/${parts[0]}` : "/";
}

export type { RouteAnalysis, RouteEntry, RouteGroup } from "./types.js";
export type {
  AuthInfo,
  AuthStrategy,
  MiddlewarePurpose,
  MiddlewareRef,
  ParamLocation,
  RouteMethod,
  RouteParam,
  ValidationInfo,
  ValidationLib,
} from "./types.js";
