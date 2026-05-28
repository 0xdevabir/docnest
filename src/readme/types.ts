import type { ProjectStructure } from "../scanner/types.js";
import type { AnalysisResult } from "../analyzer/types.js";
import type { ArchitectureMap } from "../architecture/types.js";
import type { DependencyGraph } from "../dependency-graph/types.js";

export type PackageManager = "pnpm" | "yarn" | "npm" | "bun";

export interface ReadmeContext {
  projectRoot: string;
  projectName: string;
  projectDescription?: string;
  version?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  packageManager: PackageManager;
  structure: ProjectStructure;
  analysis?: AnalysisResult;
  architecture?: ArchitectureMap;
  depGraph?: DependencyGraph;
}

export interface RenderedSection {
  id: string;
  title: string;
  content: string;
}

export interface SectionRenderer {
  id: string;
  render(ctx: ReadmeContext): RenderedSection | null;
}

export interface ReadmeTemplate {
  name: string;
  description: string;
  /** Ordered section IDs. `"*"` expands to all registered sections not yet listed. */
  sections: string[];
  exclude?: string[];
}

export interface ReadmeOptions {
  template?: string;
  skipAnalysis?: boolean;
  minConfidence?: number;
  maxFolderDepth?: number;
}

export interface ReadmeResult {
  content: string;
  sections: string[];
  templateUsed: string;
}
