import { detectCycles } from "../analyzer/graph/module-graph.js";
import type { ModuleGraph } from "../analyzer/types.js";
import type { CircularDependency, CycleSeverity } from "./types.js";

/**
 * Builds enriched circular-dependency records on top of the raw DFS cycle
 * detection from the analyzer layer.
 *
 * Severity:
 *   low    — all edges in the cycle are type-only (erased at runtime)
 *   medium — value edges present, but cycle length ≤ 2
 *   high   — value edges present and cycle spans > 2 distinct modules
 */
export function detectEnhancedCycles(graph: ModuleGraph): CircularDependency[] {
  const rawCycles = detectCycles(graph);

  return rawCycles.map((chain, id) => {
    const suggestedBreak = findWeakestEdge(chain, graph);
    return {
      id,
      chain,
      length: chain.length - 1, // last === first, so unique nodes = length - 1
      severity: scoreSeverity(chain, graph),
      ...(suggestedBreak !== undefined && { suggestedBreak }),
    };
  });
}

// ─── Severity ─────────────────────────────────────────────────────────────────

function scoreSeverity(chain: string[], graph: ModuleGraph): CycleSeverity {
  const cycleLen = chain.length - 1;
  let valueEdgeCount = 0;

  for (let i = 0; i < cycleLen; i++) {
    const from = chain[i]!;
    const to = chain[i + 1]!;
    const metas = graph.edgeMeta.get(from) ?? [];
    const edge = metas.find((e) => e.to === to);
    if (edge !== undefined && !edge.isType) valueEdgeCount++;
  }

  if (valueEdgeCount === 0) return "low";   // all type-only — safe at runtime
  if (cycleLen <= 2) return "medium";        // tight cycle (self or pair)
  return "high";
}

// ─── Break suggestion ─────────────────────────────────────────────────────────

/**
 * Identifies the weakest edge in a cycle — the one whose removal would break
 * the cycle at lowest cost.
 *
 * Scoring (lower = weaker / cheaper to remove):
 *   type-only edge: 0 + binding count
 *   value edge:   100 + binding count
 */
function findWeakestEdge(
  chain: string[],
  graph: ModuleGraph,
): { from: string; to: string } | undefined {
  const cycleLen = chain.length - 1;
  if (cycleLen === 0) return undefined;

  let weakest: { from: string; to: string } | undefined;
  let minScore = Infinity;

  for (let i = 0; i < cycleLen; i++) {
    const from = chain[i]!;
    const to = chain[i + 1]!;
    const metas = graph.edgeMeta.get(from) ?? [];
    const edge = metas.find((e) => e.to === to);
    const score = (edge?.isType === true ? 0 : 100) + (edge?.bindings.length ?? 1);

    if (score < minScore) {
      minScore = score;
      weakest = { from, to };
    }
  }

  return weakest;
}
