export { buildExplainContext } from "./context.js";
export { renderExplanation } from "./renderer.js";
export {
  purposeFacts,
  architectureFacts,
  modulesFacts,
  authFacts,
  apiFacts,
  businessLogicFacts,
} from "./facts.js";

export type {
  ExplainContext,
  ExplainDepth,
  ExplainFormat,
  ExplainOptions,
  ExplainSection,
  ExplainSectionId,
  RepoExplanation,
} from "./types.js";

import type { AIProviderAdapter } from "../ai/types.js";
import { buildExplainContext } from "./context.js";
import { renderExplanation } from "./renderer.js";
import type { ExplainOptions, RepoExplanation } from "./types.js";

/**
 * High-level entry point: scan → analyse → explain in one call.
 *
 * Pass an `adapter` for AI-summarized prose. Without it, the output is
 * formatted structured facts — still useful, just not AI-polished.
 */
export async function generateExplanation(
  root: string,
  options: ExplainOptions = {},
  adapter?: AIProviderAdapter,
): Promise<RepoExplanation> {
  const ctx = await buildExplainContext(root, options);
  return renderExplanation(ctx, options, adapter);
}
