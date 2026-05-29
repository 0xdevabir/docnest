import type { AnalysisResult } from "../analyzer/types.js";
import type { ArchitectureMap } from "../architecture/types.js";
import type { DependencyGraph } from "../dependency-graph/types.js";
import type { ProjectStructure } from "../scanner/types.js";

export type ExplainSectionId =
  | "purpose"
  | "architecture"
  | "modules"
  | "auth"
  | "api"
  | "business-logic";

export type ExplainDepth = "brief" | "standard" | "detailed";
export type ExplainFormat = "text" | "markdown";

export interface ExplainOptions {
  /** Sections to include. Default: all six. */
  sections?: ExplainSectionId[];
  /** AI provider name. If omitted, sections render as structured facts. */
  provider?: string;
  depth?: ExplainDepth;
  format?: ExplainFormat;
  minConfidence?: number;
  skipAnalysis?: boolean;
}

export interface ExplainSection {
  id: ExplainSectionId;
  title: string;
  /** Final prose — AI-summarized or structured-facts fallback. */
  content: string;
  /** Raw structured facts extracted from analysis. Always present. */
  facts: string;
  /** True when content was produced by an AI provider. */
  aiGenerated: boolean;
}

export interface ExplainContext {
  root: string;
  projectName: string;
  description?: string;
  version?: string;
  structure: ProjectStructure;
  analysis?: AnalysisResult;
  archMap?: ArchitectureMap;
  depGraph?: DependencyGraph;
}

export interface RepoExplanation {
  projectName: string;
  sections: ExplainSection[];
  /** Full Markdown document combining all sections. */
  content: string;
  generatedAt: string;
  aiProvider?: string;
  aiModel?: string;
}
