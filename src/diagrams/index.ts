export { buildDiagramContext } from "./context.js";
export { renderDiagrams } from "./renderer.js";
export {
  generateArchitectureDiagram,
  generateDependencyDiagram,
  generateModuleRelationsDiagram,
  generateRequestFlowDiagram,
} from "./generators/index.js";

export type {
  DiagramContext,
  DiagramGenerator,
  DiagramOptions,
  DiagramResult,
  DiagramType,
  DiagramsOutput,
  MermaidTheme,
  MermaidDirection,
} from "./types.js";

import { buildDiagramContext } from "./context.js";
import { renderDiagrams } from "./renderer.js";
import type { DiagramOptions, DiagramsOutput } from "./types.js";

/** High-level entry point: scan → analyse → render all diagrams in one call. */
export async function generateDiagrams(
  root: string,
  options: DiagramOptions = {},
): Promise<DiagramsOutput> {
  const ctx = await buildDiagramContext(root, options);
  return renderDiagrams(ctx);
}
