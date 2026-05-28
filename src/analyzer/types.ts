/**
 * Semantic types for repository understanding.
 * Describes WHAT code does, not how it's formatted.
 */

export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}

// ── Imports ───────────────────────────────────────────────────────────────────

export type ImportKind = "static" | "dynamic" | "require" | "require-resolve";

export interface ImportBinding {
  local: string;
  /** Name as exported from source: 'default' for default import, '*' for namespace. */
  imported: string;
  isType: boolean;
}

export interface ImportEntry {
  specifier: string;
  kind: ImportKind;
  isType: boolean;
  bindings: ImportBinding[];
  resolvedPath?: string;
  isExternal: boolean;
  location: SourceRange;
}

// ── Exports ───────────────────────────────────────────────────────────────────

export type ExportKind =
  | "named"
  | "default"
  | "namespace"
  | "re-export-named"
  | "re-export-all";

export interface ExportEntry {
  /** '*' for re-export-all. */
  name: string;
  kind: ExportKind;
  isType: boolean;
  /** Source specifier for re-exports. */
  source?: string;
  resolvedSource?: string;
  location: SourceRange;
}

// ── Parameters ────────────────────────────────────────────────────────────────

export interface ParamEntry {
  name: string;
  type?: string;
  optional: boolean;
  hasDefault: boolean;
  isRest: boolean;
}

// ── Functions ─────────────────────────────────────────────────────────────────

export type FunctionKind =
  | "declaration"
  | "expression"
  | "arrow"
  | "method"
  | "getter"
  | "setter";

export interface FunctionEntry {
  name: string;
  kind: FunctionKind;
  isAsync: boolean;
  isGenerator: boolean;
  isExported: boolean;
  isDefault: boolean;
  params: ParamEntry[];
  returnType?: string;
  jsdoc?: string;
  location: SourceRange;
}

// ── Classes ───────────────────────────────────────────────────────────────────

export interface MethodEntry {
  name: string;
  kind: "method" | "getter" | "setter" | "constructor";
  isAsync: boolean;
  isStatic: boolean;
  isAbstract: boolean;
  visibility: "public" | "protected" | "private";
  params: ParamEntry[];
  returnType?: string;
  location: SourceRange;
}

export interface PropertyEntry {
  name: string;
  type?: string;
  isStatic: boolean;
  isReadonly: boolean;
  isAbstract: boolean;
  isOptional: boolean;
  visibility: "public" | "protected" | "private";
  location: SourceRange;
}

export interface ClassEntry {
  name: string;
  isAbstract: boolean;
  isExported: boolean;
  isDefault: boolean;
  extends?: string;
  implements: string[];
  decorators: string[];
  methods: MethodEntry[];
  properties: PropertyEntry[];
  jsdoc?: string;
  location: SourceRange;
}

// ── Components ────────────────────────────────────────────────────────────────

export type ComponentKind =
  | "function"
  | "class"
  | "memo"
  | "forwardRef"
  | "lazy";

export interface ComponentEntry {
  name: string;
  kind: ComponentKind;
  isExported: boolean;
  isDefault: boolean;
  /** Name of the resolved props type/interface, if detectable. */
  propsType?: string;
  /** Custom hooks called within this component body. */
  hooksUsed: string[];
  /** True when the file lacks 'use client' and sits under an app/ directory. */
  isServerComponent: boolean;
  location: SourceRange;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export interface HookEntry {
  name: string;
  isExported: boolean;
  isDefault: boolean;
  params: ParamEntry[];
  returnType?: string;
  hooksUsed: string[];
  jsdoc?: string;
  location: SourceRange;
}

// ── API Routes ────────────────────────────────────────────────────────────────

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "ALL"
  | "unknown";

export type ApiFramework =
  | "nextjs-pages"
  | "nextjs-app"
  | "express"
  | "hono"
  | "fastify"
  | "trpc"
  | "unknown";

export interface ApiRouteEntry {
  method: HttpMethod;
  path?: string;
  handler?: string;
  framework: ApiFramework;
  isExported: boolean;
  location: SourceRange;
}

// ── Services ──────────────────────────────────────────────────────────────────

export type ServiceKind = "singleton" | "class" | "factory" | "instance";

export interface ServiceEntry {
  name: string;
  kind: ServiceKind;
  isExported: boolean;
  decorators: string[];
  location: SourceRange;
}

// ── File Analysis ─────────────────────────────────────────────────────────────

export type SourceLanguage = "typescript" | "javascript" | "tsx" | "jsx";

export interface FileAnalysis {
  path: string;
  relativePath: string;
  language: SourceLanguage;
  /** Prologue directives: 'use client', 'use server', 'use strict', etc. */
  directives: string[];
  exports: ExportEntry[];
  imports: ImportEntry[];
  components: ComponentEntry[];
  functions: FunctionEntry[];
  apiRoutes: ApiRouteEntry[];
  hooks: HookEntry[];
  classes: ClassEntry[];
  services: ServiceEntry[];
  hasDefaultExport: boolean;
  /** All top-level statements are re-exports — acts as a barrel/index. */
  isBarrelFile: boolean;
  analyzedAt: number;
}

// ── Module Graph ──────────────────────────────────────────────────────────────

export interface GraphNode {
  path: string;
  relativePath: string;
  exports: string[];
  isBarrel: boolean;
  isExternal: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  bindings: string[];
  isType: boolean;
}

export interface ModuleGraph {
  /** Absolute path → node */
  nodes: Map<string, GraphNode>;
  /** from → set of to paths */
  edges: Map<string, Set<string>>;
  /** to → set of from paths (consumers) */
  reverseEdges: Map<string, Set<string>>;
  /** from → outgoing edge metadata */
  edgeMeta: Map<string, GraphEdge[]>;
}

// ── Analysis API ──────────────────────────────────────────────────────────────

export interface AnalysisOptions {
  root: string;
  /** Absolute paths to files to analyse. */
  files: string[];
  tsConfigPath?: string;
  /** Skip graph construction (faster for one-shot per-file queries). */
  skipGraph?: boolean;
  ignore?: string[];
}

export interface AnalysisResult {
  files: Map<string, FileAnalysis>;
  graph: ModuleGraph;
  stats: {
    filesAnalyzed: number;
    fromCache: number;
    durationMs: number;
  };
}
