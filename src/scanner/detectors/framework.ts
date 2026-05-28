import path from "node:path";
import type {
  Dependency,
  FileEntry,
  FrameworkDetection,
  FrameworkType,
} from "../types.js";
import { defaultEngine } from "./framework/index.js";
import type { DetectorContext } from "./framework/types.js";

const SCORE_BANDS: Array<[number, "high" | "medium" | "low"]> = [
  [0.65, "high"],
  [0.35, "medium"],
  [0, "low"],
];

function scoreToBand(score: number): "high" | "medium" | "low" {
  for (const [threshold, band] of SCORE_BANDS) {
    if (score >= threshold) return band;
  }
  return "low";
}

const KNOWN_FRAMEWORK_IDS = new Set<string>([
  "next", "vite", "astro", "remix", "nuxt", "svelte", "angular",
  "react", "vue", "nest", "express", "fastify",
  "prisma", "tailwind", "shadcn", "docker", "postgresql", "supabase",
]);

function toFrameworkType(id: string): FrameworkType {
  return KNOWN_FRAMEWORK_IDS.has(id) ? (id as FrameworkType) : "none";
}

export function detectFramework(
  dependencies: Dependency[],
  configFileNames: string[],
  files: FileEntry[] = [],
): FrameworkDetection {
  const deps = new Set(dependencies.map((d) => d.name));
  const devDeps = new Set(
    dependencies
      .filter((d) => d.type === "dev" || d.type === "peer")
      .map((d) => d.name),
  );

  const filePaths = files.map((f) => f.relativePath);

  const rootFiles = new Set(
    files
      .filter(
        (f) =>
          !f.relativePath.includes(path.sep) &&
          !f.relativePath.includes("/"),
      )
      .map((f) => f.name),
  );

  const dirNames = new Set<string>();
  for (const f of files) {
    const parts = f.relativePath.split(/[/\\]/);
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part) dirNames.add(part);
    }
  }

  const ctx: DetectorContext = {
    deps,
    devDeps,
    configFiles: new Set(configFileNames),
    filePaths,
    rootFiles,
    dirNames,
  };

  const detected = defaultEngine.runFiltered(ctx, 0.1);

  if (detected.length === 0) {
    return {
      primary: "none",
      confidence: "high",
      score: 1,
      evidence: [],
      detected: [],
    };
  }

  const best = detected[0]!;

  return {
    primary: toFrameworkType(best.id),
    confidence: scoreToBand(best.confidence),
    score: best.confidence,
    evidence: best.evidence,
    detected,
  };
}
