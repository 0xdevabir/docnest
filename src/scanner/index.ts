export { RepositoryScanner, scanRepository } from "./scanner.js";
export { ScanCache } from "./cache.js";
export { IgnoreSystem } from "./ignore.js";
export { classifyConfig, getExtension, isSourceFile } from "./file-utils.js";
export { detectEntrypoints } from "./detectors/entrypoints.js";
export { detectConfigs } from "./detectors/configs.js";
export { extractDependencies } from "./detectors/dependencies.js";
export { extractScripts } from "./detectors/scripts.js";
export { detectMonorepo } from "./detectors/monorepo.js";
export { detectFramework } from "./detectors/framework.js";
export {
  FrameworkEngine,
  BUILTIN_DETECTORS,
  runDetection,
  combineWeights,
} from "./detectors/framework/index.js";
export type {
  CachedScan,
  ConfigFile,
  ConfigType,
  Dependency,
  DependencyType,
  DetectedFramework,
  Entrypoint,
  EntrypointType,
  FileEntry,
  FrameworkDetection,
  FrameworkType,
  MonorepoInfo,
  MonorepoType,
  PackageJson,
  ProjectStructure,
  ScanOptions,
  ScanStats,
  ScriptEntry,
  WorkspacePackage,
} from "./types.js";
export type {
  DetectorContext,
  FrameworkDetector,
} from "./detectors/framework/types.js";
