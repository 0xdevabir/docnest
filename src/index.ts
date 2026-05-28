/**
 * DocSmith public API.
 *
 * This is the library entrypoint for consumers who `import` DocSmith
 * programmatically (e.g. a plugin, a test, or a custom build script).
 *
 * The CLI entrypoint is `src/cli/index.ts`.
 */

// Config
export { defineConfig, loadConfig, tryLoadConfig } from "./core/config/index.js";
export type {
  DocSmithConfig,
  DocSmithUserConfig,
  LoadConfigOptions,
  ResolvedConfig,
} from "./core/config/index.js";
export type {
  AIConfig,
  DiagramConfig,
  FrameworkConfig,
  OutputConfig,
  PluginEntry,
  TemplatesConfig,
} from "./core/config/schema.js";

// Logger
export { Logger, logger } from "./core/logger/index.js";
export type { LogLevel, LoggerOptions } from "./core/logger/index.js";

// Errors
export {
  DocSmithError,
  ConfigError,
  ConfigNotFoundError,
  ConfigValidationError,
  PluginError,
  PluginLoadError,
  CommandError,
  FileSystemError,
} from "./core/errors/index.js";

// Plugin system
export { PluginRunner } from "./plugins/index.js";
export type { DocSmithPlugin, PluginContext, PluginFactory } from "./plugins/index.js";

// AI provider system
export { aiRegistry } from "./ai/index.js";
export type {
  AIProvider,
  AIProviderAdapter,
  AIProviderConfig,
  AIResponse,
  AIUsage,
  GenerateRequest,
  ExplainRequest,
} from "./ai/index.js";

// AST analysis engine
export { ASTAnalyzerService, analyzeRoutes, analyzeSourceFile, buildModuleGraph, detectCycles, emptyGraph, findConsumers, findTsConfig, loadCompilerOptions, ModuleResolver, parseSingleFile, TypeScriptParser } from "./analyzer/index.js";
export type { AnalysisOptions, AnalysisResult, ApiFramework, ApiRouteEntry, AuthInfo, AuthStrategy, ClassEntry, ComponentEntry, ComponentKind, ExportEntry, ExportKind, FileAnalysis, FunctionEntry, FunctionKind, GraphEdge, GraphNode, HookEntry, HttpMethod, ImportBinding, ImportEntry, ImportKind, MethodEntry, MiddlewarePurpose, MiddlewareRef, ModuleGraph, ParamEntry, ParamLocation, PropertyEntry, RouteAnalysis, RouteEntry, RouteGroup, RouteMethod, RouteParam, ServiceEntry, ServiceKind, SourceLanguage, SourceLocation, SourceRange, ValidationInfo, ValidationLib } from "./analyzer/index.js";

// Architecture understanding engine
export { ArchitectureAnalyzerService, DEFAULT_SIGNAL_WEIGHTS } from "./architecture/index.js";
export { AUTH_LIB_RULES, PATTERN_RULES, STATE_LIB_RULES } from "./architecture/index.js";
export { PATH_SIGNAL_RULES, IMPORT_SIGNAL_RULES, NAMING_RULES } from "./architecture/index.js";
export type { ArchitectureMap, ArchitectureOptions, ArchZone, ArchLayer, FeatureBoundary, ServiceLayer, StateManagementSystem, ApiArchitecture, AuthSystem, ArchPattern, CoreModule, BusinessLogicArea, ProjectMap, DirectoryNode, ArchitectureGraph, ArchNode, ArchEdge, ZoneKind, LayerKind, PatternKind, StateKind, AuthKind, CoreModuleRole, SignalWeights, ArchEvidence } from "./architecture/index.js";

// Dependency graph engine
export {
  buildDependencyGraph,
  buildFromModuleGraph,
  detectEnhancedCycles,
  findShortestPath,
  findAllPaths,
  topologicalSort,
  transitiveDeps,
  transitiveConsumers,
  longestChain,
  serializeGraph,
  toMermaid,
  toMermaidString,
  toD3,
  toDot,
  categorizeNode,
  computeDepths,
  computeHubThreshold,
  computeImportance,
  computeMetrics,
  findEntryPoints,
} from "./dependency-graph/index.js";
export type {
  CircularDependency,
  CycleSeverity,
  D3Graph,
  D3Link,
  D3Node,
  DependencyChain,
  DependencyEdge,
  DependencyGraph,
  DependencyNode,
  DotOptions,
  EdgeKind,
  FindAllPathsOptions,
  GraphMetrics,
  MermaidDirection,
  MermaidEdge,
  MermaidGraph,
  MermaidNode,
  MermaidOptions,
  MermaidSubgraph,
  NodeCategory,
  SerializedEdge,
  SerializedGraph,
  SerializedNode,
} from "./dependency-graph/index.js";

// API docs engine
export { generateApiDocs, collectRoutes, groupByTag, renderApiDocs, displayPath } from "./api-docs/index.js";
export type {
  ApiDocsContext,
  ApiDocsOptions,
  ApiDocsResult,
  CollectedRoute,
  RouteTag,
} from "./api-docs/index.js";

// Types
export type { CliContext, Result, DeepPartial, Dict, Maybe, SemVer } from "./types/index.js";
export { ok, err } from "./types/index.js";
