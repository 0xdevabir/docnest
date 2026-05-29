/**
 * Fact extractors — one per explain section.
 *
 * Each function returns a compact Markdown-formatted string built exclusively
 * from static analysis data. These strings serve two roles:
 *   1. Direct structured output when no AI provider is configured.
 *   2. Grounding context fed to the AI to prevent hallucination.
 *
 * Nothing in this file guesses, infers, or invents. It only reads what the
 * analyzers have already committed to.
 */

import type { ExplainContext } from "./types.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function rel(absPath: string, root: string): string {
  return absPath.startsWith(root + "/") ? absPath.slice(root.length + 1) : absPath;
}

function bullet(label: string, value: string): string {
  return `- **${label}:** ${value}`;
}

const NONE = "_No data available (run without --skip-analysis)._";

// ── Purpose ───────────────────────────────────────────────────────────────────

export function purposeFacts(ctx: ExplainContext): string {
  const lines: string[] = [];
  const pkg = ctx.structure.packageJson;

  lines.push(bullet("Name", `${ctx.projectName}${ctx.version ? ` v${ctx.version}` : ""}`));

  if (ctx.description) lines.push(bullet("Description", ctx.description));

  // Language breakdown
  const tsCount = ctx.structure.files.filter((f) => f.ext === ".ts" || f.ext === ".tsx").length;
  const jsCount = ctx.structure.files.filter((f) => f.ext === ".js" || f.ext === ".jsx").length;
  const lang = tsCount > 0 && tsCount >= jsCount ? "TypeScript" : "JavaScript";
  lines.push(bullet("Language", lang));

  // Framework
  const fw = ctx.structure.framework;
  if (fw.primary !== "none") {
    lines.push(bullet("Framework", `${capitalize(fw.primary)} (${fw.confidence})`));
  }

  // Monorepo
  if (ctx.structure.monorepo.type !== null) {
    const wpCount = ctx.structure.monorepo.workspaces.length;
    lines.push(bullet("Monorepo", `${ctx.structure.monorepo.type} (${wpCount} workspace${wpCount !== 1 ? "s" : ""})`));
  }

  // Entry points
  if (ctx.structure.entrypoints.length > 0) {
    const eps = ctx.structure.entrypoints.map((e) => `\`${e.relativePath}\``).join(", ");
    lines.push(bullet("Entry points", eps));
  }

  // Key prod dependencies (first 12)
  const prodDeps = ctx.structure.dependencies
    .filter((d) => d.type === "prod")
    .map((d) => d.name)
    .slice(0, 12);
  if (prodDeps.length > 0) {
    lines.push(bullet("Key dependencies", prodDeps.join(", ")));
  }

  // Scripts
  if (pkg?.scripts && Object.keys(pkg.scripts).length > 0) {
    lines.push(bullet("Scripts", Object.keys(pkg.scripts).join(", ")));
  }

  // File stats
  const fileCount = ctx.analysis?.stats.filesAnalyzed ?? ctx.structure.files.length;
  lines.push(bullet("Source files analysed", String(fileCount)));

  return lines.join("\n");
}

// ── Architecture ──────────────────────────────────────────────────────────────

export function architectureFacts(ctx: ExplainContext): string {
  const { archMap } = ctx;
  if (archMap === undefined) return NONE;

  const lines: string[] = [];

  // Top architectural pattern
  const topPattern = archMap.patterns[0];
  if (topPattern !== undefined && topPattern.confidence >= 0.25) {
    lines.push(bullet("Pattern", `${topPattern.label} (${pct(topPattern.confidence)} confidence)`));
    if (topPattern.description.length > 0) {
      lines.push(bullet("Description", topPattern.description));
    }
  }

  // Zones
  const visibleZones = archMap.zones.filter((z) => z.confidence >= 0.3);
  if (visibleZones.length > 0) {
    lines.push(`\n**Zones (${visibleZones.length}):**`);
    for (const z of visibleZones) {
      lines.push(`- ${z.label}: ${z.files.length} files (cohesion ${pct(z.cohesion)}, coupling ${pct(z.coupling)})`);
    }
  }

  // Layers
  const visibleLayers = archMap.layers.filter((l) => l.confidence >= 0.3);
  if (visibleLayers.length > 0) {
    lines.push(`\n**Layers (${visibleLayers.length}):**`);
    for (const l of visibleLayers) {
      lines.push(`- ${l.label}: ${l.files.length} files`);
    }
  }

  // Feature domains
  const features = archMap.features.filter((f) => f.confidence >= 0.4);
  if (features.length > 0) {
    const names = features.slice(0, 10).map((f) => f.name).join(", ");
    lines.push(`\n` + bullet("Feature domains", names));
  }

  // State management
  if (archMap.state.length > 0) {
    const stateNames = archMap.state.map((s) => `${s.label} (${pct(s.confidence)})`).join(", ");
    lines.push(bullet("State management", stateNames));
  }

  // Stats
  lines.push(bullet(
    "Coverage",
    `${archMap.stats.classifiedFiles} of ${archMap.stats.totalFiles} files classified`,
  ));

  return lines.join("\n");
}

// ── Core Modules ──────────────────────────────────────────────────────────────

export function modulesFacts(ctx: ExplainContext): string {
  const { archMap, depGraph, structure } = ctx;
  const lines: string[] = [];

  // Core modules (most imported)
  if (archMap !== undefined && archMap.coreModules.length > 0) {
    lines.push(`**Core modules (most imported across the codebase):**`);
    for (const mod of archMap.coreModules.slice(0, 12)) {
      const exports =
        mod.exports.length > 0 ? ` — exports: ${mod.exports.slice(0, 4).join(", ")}` : "";
      lines.push(`- \`${mod.relativePath}\` · role: **${mod.role}** · imported by **${mod.consumerCount}** modules${exports}`);
    }
  }

  // Entry points
  if (structure.entrypoints.length > 0) {
    lines.push(`\n**Entry points:**`);
    for (const ep of structure.entrypoints) {
      lines.push(`- \`${ep.relativePath}\` (${ep.type})`);
    }
  }

  // Dep-graph hub nodes (highest in-degree, not already listed)
  if (depGraph !== undefined && depGraph.hubs.size > 0) {
    const listedPaths = new Set(archMap?.coreModules.map((m) => m.relativePath) ?? []);
    const extraHubs = [...depGraph.hubs]
      .map((h) => depGraph.nodes.get(h))
      .filter((n): n is NonNullable<typeof n> => n !== undefined && !listedPaths.has(n.relativePath))
      .sort((a, b) => b.inDegree - a.inDegree)
      .slice(0, 5);

    if (extraHubs.length > 0) {
      lines.push(`\n**Additional hub modules (dep graph):**`);
      for (const hub of extraHubs) {
        lines.push(`- \`${hub.relativePath}\` · ${hub.inDegree} consumers`);
      }
    }
  }

  // Circular dependency summary
  if (depGraph !== undefined && depGraph.cycles.length > 0) {
    const highSev = depGraph.cycles.filter((c) => c.severity === "high").length;
    lines.push(
      `\n` + bullet(
        "Circular dependencies",
        `${depGraph.cycles.length} total${highSev > 0 ? `, **${highSev} high-severity**` : ""}`,
      ),
    );
  }

  return lines.join("\n") || NONE;
}

// ── Authentication ────────────────────────────────────────────────────────────

export function authFacts(ctx: ExplainContext): string {
  const { archMap, analysis, root } = ctx;

  if (archMap === undefined) return NONE;
  if (archMap.auth === null) {
    return "_No authentication system detected in this codebase._";
  }

  const { auth } = archMap;
  const lines: string[] = [];

  lines.push(bullet("Library", `${auth.label} (${pct(auth.confidence)} confidence)`));
  lines.push(bullet("Strategy", auth.strategy));
  lines.push(bullet("Kind", auth.kind));

  if (auth.authFiles.length > 0) {
    lines.push(`\n**Auth-related files (${auth.authFiles.length}):**`);
    for (const f of auth.authFiles.slice(0, 6)) {
      lines.push(`- \`${rel(f, root)}\``);
    }
  }

  // Count protected routes
  if (analysis !== undefined) {
    let protected_ = 0;
    let total = 0;
    for (const fa of analysis.files.values()) {
      for (const route of fa.routes.routes) {
        total++;
        if (route.auth.protected) protected_++;
      }
    }
    if (total > 0) {
      lines.push(`\n` + bullet("Protected routes", `${protected_} of ${total} routes require authentication`));
    }
  }

  // Secondary evidence
  const secondaryEvidence = auth.evidence.slice(1).filter((e) => e.weight > 0.2);
  if (secondaryEvidence.length > 0) {
    lines.push(`\n**Secondary auth signals:**`);
    for (const ev of secondaryEvidence) {
      lines.push(`- ${ev.description}`);
    }
  }

  return lines.join("\n");
}

// ── API Structure ─────────────────────────────────────────────────────────────

export function apiFacts(ctx: ExplainContext): string {
  const { archMap, analysis, root } = ctx;

  if (archMap === undefined) return NONE;
  if (archMap.api === null) {
    return "_No API layer detected in this codebase._";
  }

  const { api } = archMap;
  const lines: string[] = [];

  lines.push(bullet("Framework", api.framework));
  lines.push(bullet("Style", api.styles.join(", ")));
  lines.push(bullet("Estimated endpoints", String(api.estimatedEndpoints)));
  lines.push(bullet("Route files", String(api.routeFiles.length)));

  // Detailed route list from analysis
  if (analysis !== undefined) {
    const routeFiles: Array<{ file: string; routes: Array<{ method: string; path: string; handler: string; protected: boolean }> }> = [];

    for (const fa of analysis.files.values()) {
      if (fa.routes.routes.length === 0) continue;
      routeFiles.push({
        file: fa.relativePath,
        routes: fa.routes.routes.map((r) => ({
          method: r.methods[0] ?? "GET",
          path:    r.path ?? "/",
          handler: r.handler,
          protected: r.auth.protected,
        })),
      });
    }

    if (routeFiles.length > 0) {
      lines.push(`\n**Route breakdown:**`);
      let shownRoutes = 0;
      for (const rf of routeFiles.slice(0, 8)) {
        lines.push(`\n\`${rf.file}\` (${rf.routes.length} routes)`);
        for (const r of rf.routes.slice(0, 5)) {
          const lock = r.protected ? " 🔒" : "";
          lines.push(`  - ${r.method} ${r.path} → \`${r.handler}()\`${lock}`);
          if (++shownRoutes >= 20) break;
        }
        if (shownRoutes >= 20) break;
      }
    }
  } else {
    lines.push(`\n**Route files:**`);
    for (const f of api.routeFiles.slice(0, 6)) {
      lines.push(`- \`${rel(f, root)}\``);
    }
  }

  return lines.join("\n");
}

// ── Business Logic ────────────────────────────────────────────────────────────

export function businessLogicFacts(ctx: ExplainContext): string {
  const { archMap, root } = ctx;

  if (archMap === undefined) return NONE;
  if (archMap.businessLogic.length === 0 && archMap.serviceLayers.length === 0) {
    return "_No distinct business logic domains identified._";
  }

  const lines: string[] = [];

  if (archMap.businessLogic.length > 0) {
    lines.push(`**Business domains (${archMap.businessLogic.length} identified):**`);
    for (const domain of archMap.businessLogic.slice(0, 8)) {
      lines.push(`\n**${domain.name}** (${pct(domain.confidence)})`);
      lines.push(`- Classes: ${domain.entities.slice(0, 5).join(", ")}`);
      if (domain.concepts.length > 0) {
        lines.push(`- Domain concepts: ${domain.concepts.slice(0, 5).join(", ")}`);
      }
      const files = domain.files.slice(0, 3).map((f) => `\`${rel(f, root)}\``).join(", ");
      lines.push(`- Files: ${files}`);
    }
  }

  if (archMap.serviceLayers.length > 0) {
    lines.push(`\n**Service layers:**`);
    for (const sl of archMap.serviceLayers) {
      const svcs = sl.services.slice(0, 6).join(", ");
      lines.push(`- **${sl.name}** (${sl.files.length} files): ${svcs}`);
    }
  }

  // Surface domain layer files directly if no business logic found via class names
  if (archMap.businessLogic.length === 0) {
    const domainLayer = archMap.layers.find((l) => l.kind === "domain" || l.kind === "application");
    if (domainLayer !== undefined && domainLayer.files.length > 0) {
      lines.push(`\n**Domain/application layer files (${domainLayer.files.length}):**`);
      for (const f of domainLayer.files.slice(0, 8)) {
        lines.push(`- \`${rel(f, root)}\``);
      }
    }
  }

  return lines.join("\n");
}

// ── Internal ──────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
