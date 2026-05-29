import type { AnalysisResult } from "../analyzer/types.js";
import type { ArchitectureMap } from "../architecture/types.js";
import type { DependencyGraph, MermaidDirection } from "../dependency-graph/types.js";

export type { MermaidDirection };

export type DiagramType =
  | "architecture"
  | "dependency"
  | "request-flow"
  | "module-relations";

export type MermaidTheme = "default" | "dark" | "forest" | "neutral";

export interface DiagramOptions {
  /** Diagram types to generate. Default: all four. */
  types?: DiagramType[];
  direction?: MermaidDirection;
  /** Max nodes to render in dep/module diagrams. Default: 80. */
  maxNodes?: number;
  minConfidence?: number;
  skipAnalysis?: boolean;
  theme?: MermaidTheme;
  /** Exclude external package nodes in dep graph. Default: true. */
  internalOnly?: boolean;
}

export interface DiagramResult {
  type: DiagramType;
  title: string;
  /** Raw Mermaid string (no fences). */
  mermaid: string;
  /** Fenced ```mermaid block for embedding in Markdown. */
  markdown: string;
}

export interface DiagramContext {
  root: string;
  options: DiagramOptions;
  analysis?: AnalysisResult;
  archMap?: ArchitectureMap;
  depGraph?: DependencyGraph;
}

export interface DiagramsOutput {
  diagrams: DiagramResult[];
  /** All diagrams as a single Markdown document. */
  content: string;
  diagramCount: number;
}

/** Each generator accepts a DiagramContext and returns a result or null when skipped. */
export type DiagramGenerator = (ctx: DiagramContext) => DiagramResult | null;
