export type ConfigType =
  | "tsconfig"
  | "eslint"
  | "prettier"
  | "vite"
  | "webpack"
  | "rollup"
  | "babel"
  | "jest"
  | "vitest"
  | "tailwind"
  | "postcss"
  | "docker"
  | "ci"
  | "env"
  | "editorconfig"
  | "nvmrc"
  | "lockfile"
  | "other";

export type FrameworkType =
  | "next"
  | "vite"
  | "astro"
  | "remix"
  | "nuxt"
  | "svelte"
  | "angular"
  | "react"
  | "vue"
  | "nest"
  | "express"
  | "fastify"
  | "none";

export type MonorepoType =
  | "pnpm"
  | "yarn"
  | "npm"
  | "lerna"
  | "nx"
  | "turborepo"
  | null;

export type DependencyType = "prod" | "dev" | "peer" | "optional";

export type EntrypointType = "main" | "module" | "bin" | "exports" | "index";

export interface FileEntry {
  path: string;
  relativePath: string;
  name: string;
  ext: string;
  /** Populated lazily via fetchStats(); 0 until then. */
  size: number;
  /** Populated lazily via fetchStats(); 0 until then. */
  mtime: number;
}

export interface ConfigFile {
  path: string;
  relativePath: string;
  type: ConfigType;
}

export interface Entrypoint {
  path: string;
  relativePath: string;
  type: EntrypointType;
  name?: string;
}

export interface Dependency {
  name: string;
  version: string;
  type: DependencyType;
  /** Relative path of the package.json this came from. */
  source: string;
}

export interface ScriptEntry {
  name: string;
  command: string;
  /** Relative path of the package.json this came from. */
  source: string;
}

export interface PackageJson {
  name?: string;
  version?: string;
  main?: string;
  module?: string;
  bin?: string | Record<string, string>;
  exports?: unknown;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
}

export interface WorkspacePackage {
  name: string;
  path: string;
  relativePath: string;
  packageJson: PackageJson;
}

export interface MonorepoInfo {
  type: MonorepoType;
  workspaces: WorkspacePackage[];
}

export interface FrameworkDetection {
  primary: FrameworkType;
  confidence: "high" | "medium" | "low";
  evidence: string[];
}

export interface ScanStats {
  totalFiles: number;
  totalDirs: number;
  skippedDirs: number;
  durationMs: number;
}

export interface ProjectStructure {
  root: string;
  files: FileEntry[];
  entrypoints: Entrypoint[];
  configs: ConfigFile[];
  dependencies: Dependency[];
  scripts: ScriptEntry[];
  monorepo: MonorepoInfo;
  framework: FrameworkDetection;
  packageJson: PackageJson | null;
  stats: ScanStats;
}

export interface ScanOptions {
  root: string;
  maxDepth?: number;
  maxFiles?: number;
  /** Extra directory names or patterns to skip in addition to defaults. */
  extraIgnores?: string[];
  followSymlinks?: boolean;
}

export interface CachedScan {
  result: ProjectStructure;
  rootMtime: number;
  timestamp: number;
}
