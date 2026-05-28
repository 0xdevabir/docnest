import type { Dependency, FrameworkDetection, FrameworkType } from "../types.js";

interface Signal {
  type: FrameworkType;
  confidence: "high" | "medium" | "low";
  evidence: string;
}

const CONFIDENCE_RANK: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// Dependency name → detection signal
const DEP_SIGNALS = new Map<string, Signal>([
  ["next", { type: "next", confidence: "high", evidence: "dep:next" }],
  ["@remix-run/react", { type: "remix", confidence: "high", evidence: "dep:@remix-run/react" }],
  ["@remix-run/node", { type: "remix", confidence: "high", evidence: "dep:@remix-run/node" }],
  ["@remix-run/server-runtime", { type: "remix", confidence: "high", evidence: "dep:@remix-run/server-runtime" }],
  ["astro", { type: "astro", confidence: "high", evidence: "dep:astro" }],
  ["nuxt", { type: "nuxt", confidence: "high", evidence: "dep:nuxt" }],
  ["@nuxt/core", { type: "nuxt", confidence: "high", evidence: "dep:@nuxt/core" }],
  ["@sveltejs/kit", { type: "svelte", confidence: "high", evidence: "dep:@sveltejs/kit" }],
  ["svelte", { type: "svelte", confidence: "medium", evidence: "dep:svelte" }],
  ["@angular/core", { type: "angular", confidence: "high", evidence: "dep:@angular/core" }],
  ["@nestjs/core", { type: "nest", confidence: "high", evidence: "dep:@nestjs/core" }],
  ["fastify", { type: "fastify", confidence: "high", evidence: "dep:fastify" }],
  ["express", { type: "express", confidence: "medium", evidence: "dep:express" }],
  ["vue", { type: "vue", confidence: "medium", evidence: "dep:vue" }],
  ["@vue/core", { type: "vue", confidence: "high", evidence: "dep:@vue/core" }],
  ["vite", { type: "vite", confidence: "medium", evidence: "dep:vite" }],
  ["react", { type: "react", confidence: "low", evidence: "dep:react" }],
  ["react-dom", { type: "react", confidence: "low", evidence: "dep:react-dom" }],
]);

// Config filename → detection signal (checked by basename)
const CONFIG_SIGNALS = new Map<string, Signal>([
  ["next.config.js", { type: "next", confidence: "high", evidence: "config:next.config.js" }],
  ["next.config.ts", { type: "next", confidence: "high", evidence: "config:next.config.ts" }],
  ["next.config.mjs", { type: "next", confidence: "high", evidence: "config:next.config.mjs" }],
  ["astro.config.js", { type: "astro", confidence: "high", evidence: "config:astro.config.js" }],
  ["astro.config.mjs", { type: "astro", confidence: "high", evidence: "config:astro.config.mjs" }],
  ["astro.config.ts", { type: "astro", confidence: "high", evidence: "config:astro.config.ts" }],
  ["nuxt.config.ts", { type: "nuxt", confidence: "high", evidence: "config:nuxt.config.ts" }],
  ["nuxt.config.js", { type: "nuxt", confidence: "high", evidence: "config:nuxt.config.js" }],
  ["svelte.config.js", { type: "svelte", confidence: "high", evidence: "config:svelte.config.js" }],
  ["svelte.config.ts", { type: "svelte", confidence: "high", evidence: "config:svelte.config.ts" }],
  ["remix.config.js", { type: "remix", confidence: "high", evidence: "config:remix.config.js" }],
  ["vite.config.ts", { type: "vite", confidence: "medium", evidence: "config:vite.config.ts" }],
  ["vite.config.js", { type: "vite", confidence: "medium", evidence: "config:vite.config.js" }],
  ["angular.json", { type: "angular", confidence: "high", evidence: "config:angular.json" }],
]);

export function detectFramework(
  dependencies: Dependency[],
  configFileNames: string[],
): FrameworkDetection {
  const signals: Signal[] = [];

  const depNames = new Set(dependencies.map((d) => d.name));
  for (const [dep, signal] of DEP_SIGNALS) {
    if (depNames.has(dep)) signals.push(signal);
  }

  const cfgSet = new Set(configFileNames);
  for (const [cfg, signal] of CONFIG_SIGNALS) {
    if (cfgSet.has(cfg)) signals.push(signal);
  }

  if (signals.length === 0) {
    return { primary: "none", confidence: "high", evidence: [] };
  }

  // Best signal per framework type
  const byType = new Map<FrameworkType, Signal>();
  for (const s of signals) {
    const existing = byType.get(s.type);
    if (!existing || (CONFIDENCE_RANK[s.confidence] ?? 0) > (CONFIDENCE_RANK[existing.confidence] ?? 0)) {
      byType.set(s.type, s);
    }
  }

  // Pick highest-confidence winner; stable sort for determinism
  const ranked = [...byType.values()].sort(
    (a, b) =>
      (CONFIDENCE_RANK[b.confidence] ?? 0) - (CONFIDENCE_RANK[a.confidence] ?? 0),
  );
  const best = ranked[0];

  if (!best) {
    return { primary: "none", confidence: "high", evidence: [] };
  }

  return {
    primary: best.type,
    confidence: best.confidence,
    evidence: signals.map((s) => s.evidence),
  };
}
