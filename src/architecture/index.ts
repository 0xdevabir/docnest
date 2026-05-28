export { ArchitectureAnalyzerService } from "./service.js";

// Detectors (for custom pipeline usage)
export {
  detectApiArchitecture,
  detectAuthSystem,
  detectFeatures,
  detectLayers,
  detectPatterns,
  detectStateManagement,
  detectZones,
  identifyBusinessLogic,
  identifyCoreModules,
  identifyServiceLayers,
} from "./detectors/index.js";

// Graph utilities
export {
  buildArchGraph,
  buildProjectMap,
  computeCohesion,
  computeCoupling,
  computeNodeCentrality,
  findStronglyConnectedComponents,
} from "./graph/index.js";

// Signal rule tables (exported for extension by plugins)
export {
  collectAllSignals,
  collectFileSignals,
  IMPORT_SIGNAL_RULES,
  NAMING_RULES,
  PATH_SIGNAL_RULES,
  winningVote,
} from "./signals.js";

// Pattern / auth / state rule tables
export { AUTH_LIB_RULES } from "./detectors/auth.js";
export { PATTERN_RULES } from "./detectors/patterns.js";
export { STATE_LIB_RULES } from "./detectors/state.js";

// Values
export { DEFAULT_SIGNAL_WEIGHTS } from "./types.js";

// Types
export type {
  ApiArchitecture,
  ArchEdge,
  ArchEvidence,
  ArchitectureGraph,
  ArchitectureMap,
  ArchitectureOptions,
  ArchLayer,
  ArchNode,
  ArchPattern,
  ArchZone,
  AuthKind,
  AuthSystem,
  BusinessLogicArea,
  CoreModule,
  CoreModuleRole,
  DirectoryNode,
  FeatureBoundary,
  LayerKind,
  PatternKind,
  ProjectMap,
  ServiceLayer,
  SignalWeights,
  StateKind,
  StateManagementSystem,
  ZoneKind,
} from "./types.js";

export type {
  ImportSignalRule,
  NamingRule,
  PathSignalRule,
  Signal,
  SignalKind,
} from "./signals.js";

export type { AuthLibRule } from "./detectors/auth.js";
export type { PatternRule } from "./detectors/patterns.js";
export type { StateLibRule } from "./detectors/state.js";
