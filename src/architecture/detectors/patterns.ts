import { posix } from "node:path";

import type { AnalysisResult } from "../../analyzer/types.js";
import type { ArchEvidence, ArchPattern, PatternKind } from "../types.js";

// ── Pattern rule table ─────────────────────────────────────────────────────────

export interface PatternRule {
  kind: PatternKind;
  label: string;
  description: string;
  /** Required directory/path patterns — ALL must fire at least once. */
  required: RegExp[];
  /** Optional supporting patterns — each match adds confidence. */
  optional: RegExp[];
  /** Base confidence when all required patterns match. */
  baseConfidence: number;
  /** Confidence boost per optional pattern match. */
  optionalBoost: number;
}

export const PATTERN_RULES: PatternRule[] = [
  {
    kind: "feature-sliced",
    label: "Feature-Sliced Design",
    description: "Structured by app / pages / widgets / features / entities / shared layers",
    required: [/\/features\//i],
    optional: [/\/entities\//i, /\/pages\//i, /\/widgets\//i, /\/shared\//i, /\/app\//i],
    baseConfidence: 0.55,
    optionalBoost: 0.08,
  },
  {
    kind: "clean-architecture",
    label: "Clean Architecture",
    description: "Concentric rings: domain → application → infrastructure → interface",
    required: [/\/domain\//i, /\/application\//i],
    optional: [/\/infrastructure\//i, /\/interface\//i, /\/use-?cases?\//i, /\/adapters?\//i, /\/ports?\//i],
    baseConfidence: 0.6,
    optionalBoost: 0.07,
  },
  {
    kind: "hexagonal",
    label: "Hexagonal Architecture (Ports & Adapters)",
    description: "Core domain with explicit ports and technology adapters",
    required: [/\/ports?\//i, /\/adapters?\//i],
    optional: [/\/domain\//i, /\/core\//i, /\/infrastructure\//i],
    baseConfidence: 0.6,
    optionalBoost: 0.1,
  },
  {
    kind: "mvc",
    label: "MVC Pattern",
    description: "Model-View-Controller separation",
    required: [/\/models?\//i, /\/controllers?\//i],
    optional: [/\/views?\//i, /\/routes?\//i, /\/middleware\//i],
    baseConfidence: 0.55,
    optionalBoost: 0.1,
  },
  {
    kind: "layered",
    label: "Layered (N-Tier) Architecture",
    description: "Horizontal layers: presentation → business logic → data access",
    required: [/\/(services?|business)\//i, /\/(repositor(y|ies)|data)\//i],
    optional: [/\/controllers?\//i, /\/routes?\//i, /\/(dto|schema)\//i],
    baseConfidence: 0.5,
    optionalBoost: 0.1,
  },
  {
    kind: "modular-monolith",
    label: "Modular Monolith",
    description: "Single deployable unit with explicit internal module boundaries",
    required: [/\/modules?\//i],
    optional: [/\/core\//i, /\/shared\//i, /\/common\//i],
    baseConfidence: 0.55,
    optionalBoost: 0.1,
  },
];

// ── Monorepo + microservices detection ─────────────────────────────────────────

export function detectPatterns(
  result: AnalysisResult,
  root: string,
): ArchPattern[] {
  const patterns: ArchPattern[] = [];
  const allPaths = [...result.files.keys()].map((p) =>
    posix.relative(root, p),
  );

  // ── Table-driven structural patterns ──────────────────────────────────────
  for (const rule of PATTERN_RULES) {
    const match = scorePattern(rule, allPaths);
    if (match !== null) patterns.push(match);
  }

  // ── Monorepo detection ────────────────────────────────────────────────────
  const monorepo = detectMonorepo(allPaths);
  if (monorepo !== null) patterns.push(monorepo);

  // ── Microservices detection ───────────────────────────────────────────────
  const micro = detectMicroservices(allPaths, result.files.size);
  if (micro !== null) patterns.push(micro);

  // ── Flat detection (fallback) ─────────────────────────────────────────────
  if (patterns.length === 0) {
    patterns.push({
      kind: "flat",
      label: "Flat Structure",
      description: "No discernible architectural pattern detected",
      confidence: 0.5,
      evidence: [{ description: "no standard structure dirs found", sources: [], weight: 0.5 }],
    });
  }

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

// ── Scoring logic ──────────────────────────────────────────────────────────────

function scorePattern(
  rule: PatternRule,
  allPaths: string[],
): ArchPattern | null {
  const matchedRequired: string[] = [];
  const evidence: ArchEvidence[] = [];

  for (const req of rule.required) {
    const matches = allPaths.filter((p) => req.test(p));
    if (matches.length === 0) return null; // required pattern missing
    matchedRequired.push(req.source);
    evidence.push({
      description: `required pattern matched: ${matches[0]}`,
      sources: matches.slice(0, 3),
      weight: 0.5,
    });
  }

  let confidence = rule.baseConfidence;

  for (const opt of rule.optional) {
    const matches = allPaths.filter((p) => opt.test(p));
    if (matches.length > 0) {
      confidence = Math.min(0.98, confidence + rule.optionalBoost);
      evidence.push({
        description: `optional pattern matched: ${matches[0]}`,
        sources: matches.slice(0, 2),
        weight: rule.optionalBoost,
      });
    }
  }

  return {
    kind: rule.kind,
    label: rule.label,
    description: rule.description,
    confidence,
    evidence,
  };
}

function detectMonorepo(allPaths: string[]): ArchPattern | null {
  const pkgJsonPaths = allPaths.filter(
    (p) => p.endsWith("package.json") && p !== "package.json",
  );
  if (pkgJsonPaths.length < 2) return null;

  const isWorkspaceBased =
    allPaths.some((p) => /^\/(packages?|apps?|libs?)\//.test("/" + p));

  return {
    kind: "monorepo",
    label: "Monorepo",
    description: `Multiple packages (${pkgJsonPaths.length} package.json files found)`,
    confidence: isWorkspaceBased ? 0.9 : 0.7,
    evidence: [
      {
        description: `${pkgJsonPaths.length} package.json files`,
        sources: pkgJsonPaths.slice(0, 5),
        weight: 0.7,
      },
    ],
  };
}

function detectMicroservices(
  allPaths: string[],
  totalFiles: number,
): ArchPattern | null {
  // Heuristic: many separate service directories, each with their own package.json
  const serviceDirs = new Set<string>();
  for (const p of allPaths) {
    if (p.endsWith("package.json")) {
      const dir = p.split("/").slice(0, -1).join("/");
      if (dir.split("/").length >= 2) serviceDirs.add(dir);
    }
  }

  if (serviceDirs.size < 3) return null;

  // Each service should have few files relative to the total
  const avgFilesPerService = totalFiles / serviceDirs.size;
  if (avgFilesPerService > 50) return null; // more like a monorepo than microservices

  return {
    kind: "microservices",
    label: "Microservices",
    description: `${serviceDirs.size} independent service packages detected`,
    confidence: 0.65,
    evidence: [
      {
        description: `${serviceDirs.size} separate services with own package.json`,
        sources: [...serviceDirs].slice(0, 5),
        weight: 0.65,
      },
    ],
  };
}
