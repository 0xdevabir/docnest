/**
 * Architecture understanding types.
 * Every inference is evidence-backed and confidence-scored.
 */

// ── Vocabulary ─────────────────────────────────────────────────────────────────

export type ZoneKind =
  | "frontend"       // UI, client-side rendering
  | "backend"        // server-side, business logic
  | "api"            // API boundary layer
  | "shared"         // cross-cutting code
  | "config"         // configuration, build, tooling
  | "infrastructure" // infra-as-code, deployment
  | "test"           // test files
  | "unknown";

export type LayerKind =
  | "presentation"   // UI components, views, controllers, route handlers
  | "application"    // use cases, orchestration, commands, queries
  | "domain"         // business entities, domain services, value objects
  | "infrastructure" // DB adapters, external APIs, file system
  | "shared"         // utilities, helpers, constants, types
  | "unknown";

export type PatternKind =
  | "feature-sliced"        // FSD: app/pages/widgets/features/entities/shared
  | "clean-architecture"    // domain/application/infrastructure/interface
  | "layered"               // presentation/business/data (N-tier)
  | "mvc"                   // models/views/controllers
  | "hexagonal"             // core + ports/adapters
  | "monorepo"              // multiple packages
  | "microservices"         // many independent service packages
  | "modular-monolith"      // structured modules within a single app
  | "flat"                  // no discernible structure
  | "unknown";

export type StateKind =
  | "redux"
  | "zustand"
  | "jotai"
  | "recoil"
  | "mobx"
  | "context"
  | "vuex"
  | "pinia"
  | "xstate"
  | "unknown";

export type AuthKind =
  | "jwt"
  | "session"
  | "oauth"
  | "api-key"
  | "next-auth"
  | "passport"
  | "supabase"
  | "firebase"
  | "clerk"
  | "lucia"
  | "unknown";

// ── Evidence / inference ───────────────────────────────────────────────────────

export interface ArchEvidence {
  description: string;
  /** File paths that contributed this evidence. */
  sources: string[];
  /** Contribution to overall confidence (0–1). */
  weight: number;
}

// ── Zones ──────────────────────────────────────────────────────────────────────

export interface ArchZone {
  kind: ZoneKind;
  label: string;
  /** Absolute paths of files belonging to this zone. */
  files: string[];
  confidence: number;
  evidence: ArchEvidence[];
  /** Fraction of intra-zone imports vs total imports (0–1). */
  cohesion: number;
  /** Fraction of inter-zone imports (0–1). */
  coupling: number;
}

// ── Layers ─────────────────────────────────────────────────────────────────────

export interface ArchLayer {
  kind: LayerKind;
  label: string;
  files: string[];
  confidence: number;
  evidence: ArchEvidence[];
}

// ── Feature boundaries ─────────────────────────────────────────────────────────

export interface FeatureBoundary {
  name: string;
  /** Root directory relative to repo root, when path-based. */
  rootDir?: string;
  files: string[];
  /** Exported names that form this feature's public surface. */
  publicApi: string[];
  /** Names of other features this one imports from. */
  dependencies: string[];
  confidence: number;
  evidence: ArchEvidence[];
  /** Internal import density (0–1). */
  cohesion: number;
}

// ── Service layers ─────────────────────────────────────────────────────────────

export interface ServiceLayer {
  name: string;
  services: string[];  // class / function names
  files: string[];
  kind: "application" | "domain" | "infrastructure" | "unknown";
  confidence: number;
  evidence: ArchEvidence[];
}

// ── State management ───────────────────────────────────────────────────────────

export interface StateManagementSystem {
  kind: StateKind;
  label: string;
  storeFiles: string[];
  /** Fraction of non-test files that import this state system. */
  coverage: number;
  confidence: number;
  evidence: ArchEvidence[];
}

// ── API architecture ───────────────────────────────────────────────────────────

export interface ApiArchitecture {
  /** REST, GraphQL, tRPC, gRPC, WebSocket, etc. */
  styles: string[];
  routeFiles: string[];
  estimatedEndpoints: number;
  framework: string;
  confidence: number;
  evidence: ArchEvidence[];
}

// ── Authentication ─────────────────────────────────────────────────────────────

export interface AuthSystem {
  kind: AuthKind;
  label: string;
  authFiles: string[];
  strategy: "token" | "session" | "both" | "unknown";
  confidence: number;
  evidence: ArchEvidence[];
}

// ── Architectural patterns ─────────────────────────────────────────────────────

export interface ArchPattern {
  kind: PatternKind;
  label: string;
  description: string;
  confidence: number;
  evidence: ArchEvidence[];
}

// ── Core modules ───────────────────────────────────────────────────────────────

export type CoreModuleRole =
  | "types"
  | "utils"
  | "config"
  | "ui-primitives"
  | "data-layer"
  | "constants"
  | "unknown";

export interface CoreModule {
  path: string;
  relativePath: string;
  /** How many files import this module. */
  consumerCount: number;
  isBarrel: boolean;
  role: CoreModuleRole;
  exports: string[];
}

// ── Business logic areas ───────────────────────────────────────────────────────

export interface BusinessLogicArea {
  /** Inferred domain name (e.g. "User", "Order", "Payment"). */
  name: string;
  files: string[];
  /** Service / entity class names. */
  entities: string[];
  /** Domain concepts derived from identifier names. */
  concepts: string[];
  confidence: number;
}

// ── Project map ────────────────────────────────────────────────────────────────

export interface DirectoryNode {
  name: string;
  relativePath: string;
  zone: ZoneKind;
  layer: LayerKind;
  fileCount: number;
  children: DirectoryNode[];
  /** How certain we are about the zone/layer assignment. */
  confidence: number;
}

export interface ProjectMap {
  directories: DirectoryNode[];
  /** zone → absolute file paths */
  zones: Map<ZoneKind, string[]>;
  /** layer → absolute file paths */
  layers: Map<LayerKind, string[]>;
  features: FeatureBoundary[];
  coreModules: CoreModule[];
}

// ── Architecture graph ─────────────────────────────────────────────────────────

export interface ArchNode {
  id: string;
  kind: "zone" | "feature" | "layer" | "core-module";
  label: string;
  files: string[];
  zone?: ZoneKind;
  layer?: LayerKind;
  confidence: number;
}

export interface ArchEdge {
  from: string;
  to: string;
  /** Number of file-level connections. */
  edgeCount: number;
  /** Normalized connection strength (0–1). */
  weight: number;
  isTypeOnly: boolean;
}

export interface ArchitectureGraph {
  nodes: Map<string, ArchNode>;
  edges: ArchEdge[];
  adjacency: Map<string, Set<string>>;
}

// ── Top-level result ───────────────────────────────────────────────────────────

export interface ArchitectureMap {
  /** Detected architectural patterns, sorted by confidence desc. */
  patterns: ArchPattern[];
  zones: ArchZone[];
  layers: ArchLayer[];
  features: FeatureBoundary[];
  serviceLayers: ServiceLayer[];
  state: StateManagementSystem[];
  api: ApiArchitecture | null;
  auth: AuthSystem | null;
  coreModules: CoreModule[];
  businessLogic: BusinessLogicArea[];
  projectMap: ProjectMap;
  graph: ArchitectureGraph;
  stats: {
    totalFiles: number;
    classifiedFiles: number;
    analysisMs: number;
  };
}

// ── Options ────────────────────────────────────────────────────────────────────

export interface SignalWeights {
  pathPattern: number;
  importPattern: number;
  exportType: number;
  frameworkHint: number;
  namingConvention: number;
}

export const DEFAULT_SIGNAL_WEIGHTS: SignalWeights = {
  pathPattern: 1.0,
  importPattern: 0.9,
  exportType: 0.7,
  frameworkHint: 0.8,
  namingConvention: 0.5,
};

export interface ArchitectureOptions {
  root: string;
  /** Include all evidence in the output (default: false for brevity). */
  verbose?: boolean;
  /** Minimum confidence to include an inference (default: 0.25). */
  minConfidence?: number;
  weights?: Partial<SignalWeights>;
  /** Max top-N core modules to surface (default: 20). */
  maxCoreModules?: number;
}
