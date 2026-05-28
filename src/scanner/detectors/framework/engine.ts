import type { DetectedFramework } from "../../types.js";
import type { DetectorContext, FrameworkDetector } from "./types.js";

export class FrameworkEngine {
  private readonly detectors: FrameworkDetector[] = [];

  /** Register a detector. Returns `this` for chaining. */
  use(detector: FrameworkDetector): this {
    this.detectors.push(detector);
    return this;
  }

  /** Remove a registered detector by id. */
  remove(id: string): this {
    const idx = this.detectors.findIndex((d) => d.id === id);
    if (idx !== -1) this.detectors.splice(idx, 1);
    return this;
  }

  /** Number of registered detectors. */
  get size(): number {
    return this.detectors.length;
  }

  /**
   * Run all detectors against the context.
   * Returns every match sorted by confidence descending.
   */
  run(ctx: DetectorContext): DetectedFramework[] {
    return this.detectors
      .map((d) => d.detect(ctx))
      .filter((r): r is DetectedFramework => r !== null)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /** Like `run` but drops results below `threshold` (default 0.1). */
  runFiltered(ctx: DetectorContext, threshold = 0.1): DetectedFramework[] {
    return this.run(ctx).filter((r) => r.confidence >= threshold);
  }
}

/**
 * Diminishing-returns confidence combiner.
 * Each new signal contributes less as confidence grows.
 * Formula: confidence = 1 - Π(1 - wᵢ)
 * Naturally bounded in [0, 1] — no clamping needed.
 */
export function combineWeights(weights: number[]): number {
  const complement = weights.reduce(
    (acc, w) => acc * (1 - Math.max(0, Math.min(1, w))),
    1,
  );
  return parseFloat((1 - complement).toFixed(4));
}
