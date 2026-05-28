import { posix } from "node:path";

import type {
  AnalysisResult,
  FileAnalysis,
  ModuleGraph,
} from "../../analyzer/types.js";
import type {
  ArchLayer,
  BusinessLogicArea,
  CoreModule,
  CoreModuleRole,
  LayerKind,
  ServiceLayer,
} from "../types.js";

export { detectAuthSystem } from "./auth.js";
export { detectFeatures } from "./features.js";
export { detectLayers } from "./layers.js";
export { detectPatterns } from "./patterns.js";
export { detectStateManagement } from "./state.js";
export { detectZones } from "./zones.js";

// ── Core module identification ─────────────────────────────────────────────────

/** Minimum consumer count to be considered a "core" module. */
const CORE_MODULE_MIN_CONSUMERS = 3;

export function identifyCoreModules(
  result: AnalysisResult,
  maxResults: number,
): CoreModule[] {
  const modules: CoreModule[] = [];

  for (const [path, analysis] of result.files) {
    const consumers = result.graph.reverseEdges.get(path);
    const consumerCount = consumers?.size ?? 0;
    if (consumerCount < CORE_MODULE_MIN_CONSUMERS) continue;

    modules.push({
      path,
      relativePath: analysis.relativePath,
      consumerCount,
      isBarrel: analysis.isBarrelFile,
      role: detectModuleRole(analysis),
      exports: analysis.exports.map((e) => e.name).slice(0, 20),
    });
  }

  return modules
    .sort((a, b) => b.consumerCount - a.consumerCount)
    .slice(0, maxResults);
}

function detectModuleRole(analysis: FileAnalysis): CoreModuleRole {
  const rel = analysis.relativePath.toLowerCase();

  // Explicit path clues take priority
  if (/\/types?\/|\/interfaces?\//.test("/" + rel) || analysis.exports.every((e) => e.isType)) {
    return "types";
  }
  if (/\/config\/|\/settings?\//.test("/" + rel)) return "config";
  if (/\/constants?\//.test("/" + rel)) return "constants";
  if (/\/utils?\/|\/helpers?\//.test("/" + rel)) return "utils";

  // Content-based role
  if (analysis.components.length >= 2) return "ui-primitives";
  if (
    analysis.classes.some((c) =>
      /(Repository|Dao|Gateway|Adapter)$/.test(c.name),
    )
  ) {
    return "data-layer";
  }
  if (
    analysis.functions.length > 4 &&
    analysis.components.length === 0 &&
    analysis.hooks.length === 0
  ) {
    return "utils";
  }
  if (analysis.exports.length > 0 && analysis.exports.every((e) => e.isType)) {
    return "types";
  }

  return "unknown";
}

// ── Business logic identification ──────────────────────────────────────────────

/** Class-name patterns that strongly suggest business logic. */
const BUSINESS_PATTERNS = [
  /Service$/, /Manager$/, /Processor$/, /Calculator$/,
  /Validator$/, /Handler$/, /Orchestrator$/, /UseCase$/,
  /DomainService$/, /Policy$/, /Rule$/, /Specification$/,
];

const ENTITY_PATTERNS = [
  /Entity$/, /Aggregate$/, /Model$/, /ValueObject$/, /VO$/,
];

/** Domain concept extraction: strip common suffixes to get the domain noun. */
const CONCEPT_STRIP = /Service$|Manager$|Processor$|Entity$|Aggregate$|Handler$|Controller$|Repository$|Repo$|UseCase$/;

export function identifyBusinessLogic(
  result: AnalysisResult,
  layers: ArchLayer[],
): BusinessLogicArea[] {
  const domainFiles = layers
    .filter((l) => l.kind === "domain" || l.kind === "application")
    .flatMap((l) => l.files);

  // Group by domain concept extracted from class/function names
  const conceptGroups = new Map<string, {
    files: string[];
    entities: string[];
    concepts: string[];
  }>();

  for (const path of domainFiles) {
    const analysis = result.files.get(path);
    if (analysis === undefined) continue;

    for (const cls of analysis.classes) {
      const isBusinessClass =
        BUSINESS_PATTERNS.some((p) => p.test(cls.name)) ||
        ENTITY_PATTERNS.some((p) => p.test(cls.name));
      if (!isBusinessClass) continue;

      const concept = cls.name.replace(CONCEPT_STRIP, "");
      if (concept.length < 2) continue;

      const group = conceptGroups.get(concept) ?? {
        files: [],
        entities: [],
        concepts: [],
      };
      if (!group.files.includes(path)) group.files.push(path);
      if (!group.entities.includes(cls.name)) group.entities.push(cls.name);
      if (!group.concepts.includes(concept)) group.concepts.push(concept);
      conceptGroups.set(concept, group);
    }
  }

  // Also scan files not in domain/app layers for service classes
  for (const [path, analysis] of result.files) {
    if (domainFiles.includes(path)) continue;
    for (const cls of analysis.classes) {
      if (!BUSINESS_PATTERNS.some((p) => p.test(cls.name))) continue;
      const concept = cls.name.replace(CONCEPT_STRIP, "");
      if (concept.length < 2) continue;
      const group = conceptGroups.get(concept) ?? {
        files: [],
        entities: [],
        concepts: [],
      };
      if (!group.files.includes(path)) group.files.push(path);
      if (!group.entities.includes(cls.name)) group.entities.push(cls.name);
      if (!group.concepts.includes(concept)) group.concepts.push(concept);
      conceptGroups.set(concept, group);
    }
  }

  return [...conceptGroups.entries()]
    .filter(([, g]) => g.files.length > 0)
    .map(([name, g]) => ({
      name,
      files: g.files,
      entities: g.entities,
      concepts: g.concepts,
      confidence: Math.min(0.95, 0.5 + g.entities.length * 0.1),
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

// ── Service layer identification ───────────────────────────────────────────────

export function identifyServiceLayers(
  result: AnalysisResult,
  layers: ArchLayer[],
): ServiceLayer[] {
  const serviceLayerMap = new Map<
    "application" | "domain" | "infrastructure",
    { services: string[]; files: string[] }
  >();

  const layerKindMap: Record<LayerKind, "application" | "domain" | "infrastructure" | null> = {
    presentation: null,
    application: "application",
    domain: "domain",
    infrastructure: "infrastructure",
    shared: null,
    unknown: null,
  };

  for (const layer of layers) {
    const slKind = layerKindMap[layer.kind];
    if (slKind === null) continue;

    const group = serviceLayerMap.get(slKind) ?? { services: [], files: [] };
    group.files.push(...layer.files);

    for (const path of layer.files) {
      const analysis = result.files.get(path);
      if (analysis === undefined) continue;
      for (const cls of analysis.classes) {
        if (!group.services.includes(cls.name)) group.services.push(cls.name);
      }
    }

    serviceLayerMap.set(slKind, group);
  }

  const result2: ServiceLayer[] = [];
  const LABELS: Record<string, string> = {
    application: "Application Services",
    domain: "Domain Layer",
    infrastructure: "Infrastructure Adapters",
  };

  for (const [kind, group] of serviceLayerMap) {
    if (group.files.length === 0) continue;
    result2.push({
      name: LABELS[kind] ?? kind,
      services: group.services.slice(0, 20),
      files: group.files,
      kind,
      confidence: 0.7,
      evidence: [
        {
          description: `${group.files.length} ${kind}-layer files, ${group.services.length} classes`,
          sources: group.files.slice(0, 3),
          weight: 0.7,
        },
      ],
    });
  }

  return result2;
}

// ── API architecture detection ─────────────────────────────────────────────────

export function detectApiArchitecture(
  result: AnalysisResult,
): import("../types.js").ApiArchitecture | null {
  const routeFiles: string[] = [];
  let endpointCount = 0;
  const styles = new Set<string>();
  const frameworks = new Set<string>();

  for (const [path, analysis] of result.files) {
    if (analysis.apiRoutes.length === 0) continue;
    routeFiles.push(path);
    endpointCount += analysis.apiRoutes.length;

    for (const route of analysis.apiRoutes) {
      switch (route.framework) {
        case "nextjs-pages":
        case "nextjs-app":
          styles.add("REST");
          frameworks.add("Next.js");
          break;
        case "express":
          styles.add("REST");
          frameworks.add("Express");
          break;
        case "hono":
          styles.add("REST");
          frameworks.add("Hono");
          break;
        case "fastify":
          styles.add("REST");
          frameworks.add("Fastify");
          break;
        case "trpc":
          styles.add("tRPC");
          frameworks.add("tRPC");
          break;
      }
    }
  }

  // GraphQL detection via imports
  let hasGraphql = false;
  for (const analysis of result.files.values()) {
    if (
      analysis.imports.some(
        (i) =>
          i.isExternal &&
          /^graphql$|^apollo-server|^graphql-yoga$/.test(i.specifier),
      )
    ) {
      hasGraphql = true;
      break;
    }
  }
  if (hasGraphql) styles.add("GraphQL");

  if (routeFiles.length === 0 && !hasGraphql) return null;

  return {
    styles: [...styles],
    routeFiles,
    estimatedEndpoints: endpointCount,
    framework: [...frameworks].join(", ") || "unknown",
    confidence: Math.min(0.95, 0.5 + routeFiles.length * 0.05),
    evidence: [
      {
        description: `${routeFiles.length} route files, ~${endpointCount} endpoints`,
        sources: routeFiles.slice(0, 5),
        weight: 0.7,
      },
    ],
  };
}
