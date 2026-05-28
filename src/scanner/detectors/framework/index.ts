import type { DetectedFramework } from "../../types.js";
import { BUILTIN_DETECTORS } from "./builtins.js";
import { FrameworkEngine, combineWeights } from "./engine.js";
import type { DetectorContext, FrameworkDetector } from "./types.js";

export type { DetectedFramework, DetectorContext, FrameworkDetector };
export { FrameworkEngine, combineWeights };
export { BUILTIN_DETECTORS };

/** Default engine pre-loaded with all 12 built-in detectors. */
export const defaultEngine: FrameworkEngine = new FrameworkEngine();
for (const d of BUILTIN_DETECTORS) defaultEngine.use(d);

/**
 * Run all built-in detectors against a context.
 * For custom detector sets, instantiate `FrameworkEngine` directly.
 *
 * @param ctx     - Pre-built detector context
 * @param threshold - Minimum confidence to include (default 0.1)
 */
export function runDetection(
  ctx: DetectorContext,
  threshold = 0.1,
): DetectedFramework[] {
  return defaultEngine.runFiltered(ctx, threshold);
}
