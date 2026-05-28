import type { ApiFramework } from "../analyzer/types.js";
import type { RouteEntry } from "../analyzer/routes/types.js";

export interface ApiDocsOptions {
  /** Page title. Default: "API Reference". */
  title?: string;
  /** Base URL prepended to route paths in examples. */
  baseUrl?: string;
  /** Skip AST analysis (no routes found, but no errors either). */
  skipAnalysis?: boolean;
  /** Minimum confidence passed to the architecture engine. */
  minConfidence?: number;
}

export interface ApiDocsResult {
  /** Rendered markdown. */
  content: string;
  routeCount: number;
  tagCount: number;
  framework: ApiFramework;
}

/** A single route entry tied back to its source file. */
export interface CollectedRoute {
  entry: RouteEntry;
  filePath: string;
  relativePath: string;
}

/** Routes sharing a tag (derived from first path segment). */
export interface RouteTag {
  name: string;
  routes: CollectedRoute[];
}

/** Assembled context passed to the renderer. */
export interface ApiDocsContext {
  projectName: string;
  title: string;
  framework: ApiFramework;
  routes: CollectedRoute[];
  tags: RouteTag[];
  baseUrl: string | undefined;
}
