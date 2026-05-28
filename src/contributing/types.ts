import type { ProjectStructure } from "../scanner/types.js";
import type { AnalysisResult } from "../analyzer/types.js";
import type { ArchitectureMap } from "../architecture/types.js";

export type PackageManager = "pnpm" | "yarn" | "npm" | "bun";

export interface ContributingContext {
  projectRoot: string;
  projectName: string;
  projectDescription?: string;
  version?: string;
  license?: string;
  repo?: string;
  packageManager: PackageManager;
  structure: ProjectStructure;
  analysis?: AnalysisResult;
  architecture?: ArchitectureMap;
  hasLinting: boolean;
  hasFormatting: boolean;
  hasTests: boolean;
  hasCi: boolean;
  hasGitHooks: boolean;
  hasTypeCheck: boolean;
  hasChangelog: boolean;
  commitConvention: "conventional" | "none" | "unknown";
  testCmd?: string;
  buildCmd?: string;
  lintCmd?: string;
  formatCmd?: string;
  typeCheckCmd?: string;
  devCmd?: string;
  isMonorepo: boolean;
  mainBranch: string;
}

export interface RenderedSection {
  id: string;
  title: string;
  content: string;
}

export interface SectionRenderer {
  id: string;
  render(ctx: ContributingContext): RenderedSection | null;
}

export interface ContributingTemplate {
  name: string;
  desc: string;
  sections: string[];
  exclude?: string[];
}

export interface ContributingOptions {
  template?: string;
  skipAnalysis?: boolean;
  minConfidence?: number;
}

export interface ContributingResult {
  content: string;
  sections: string[];
  templateUsed: string;
}
