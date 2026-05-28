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
export { ASTAnalyzerService, analyzeSourceFile, buildModuleGraph, detectCycles, emptyGraph, findConsumers, findTsConfig, loadCompilerOptions, ModuleResolver, parseSingleFile, TypeScriptParser } from "./analyzer/index.js";
export type { AnalysisOptions, AnalysisResult, ApiFramework, ApiRouteEntry, ClassEntry, ComponentEntry, ComponentKind, ExportEntry, ExportKind, FileAnalysis, FunctionEntry, FunctionKind, GraphEdge, GraphNode, HookEntry, HttpMethod, ImportBinding, ImportEntry, ImportKind, MethodEntry, ModuleGraph, ParamEntry, PropertyEntry, ServiceEntry, ServiceKind, SourceLanguage, SourceLocation, SourceRange } from "./analyzer/index.js";

// Types
export type { CliContext, Result, DeepPartial, Dict, Maybe, SemVer } from "./types/index.js";
export { ok, err } from "./types/index.js";
