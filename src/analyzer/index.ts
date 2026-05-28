export { ASTAnalyzerService } from "./service.js";
export { AnalysisCache } from "./cache.js";

export {
  buildModuleGraph,
  detectCycles,
  emptyGraph,
  findConsumers,
  loadCompilerOptions,
  ModuleResolver,
} from "./graph/index.js";

export {
  analyzeSourceFile,
  extractApiRoutes,
  extractClasses,
  extractComponents,
  extractExports,
  extractFunctions,
  extractHooks,
  extractImports,
  extractServices,
} from "./extractors/index.js";

export { analyzeRoutes } from "./routes/index.js";

export {
  findTsConfig,
  parseSingleFile,
  TypeScriptParser,
} from "./parsers/index.js";

export type {
  AnalysisOptions,
  AnalysisResult,
  ApiFramework,
  ApiRouteEntry,
  ClassEntry,
  ComponentEntry,
  ComponentKind,
  ExportEntry,
  ExportKind,
  FileAnalysis,
  FunctionEntry,
  FunctionKind,
  GraphEdge,
  GraphNode,
  HookEntry,
  HttpMethod,
  ImportBinding,
  ImportEntry,
  ImportKind,
  MethodEntry,
  ModuleGraph,
  ParamEntry,
  PropertyEntry,
  RouteAnalysis,
  ServiceEntry,
  ServiceKind,
  SourceLanguage,
  SourceLocation,
  SourceRange,
} from "./types.js";

export type {
  AuthInfo,
  AuthStrategy,
  MiddlewarePurpose,
  MiddlewareRef,
  ParamLocation,
  RouteEntry,
  RouteGroup,
  RouteMethod,
  RouteParam,
  ValidationInfo,
  ValidationLib,
} from "./routes/types.js";
