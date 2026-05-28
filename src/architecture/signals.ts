/**
 * Signal rule tables and per-file signal collection.
 *
 * Rules are exported data — add entries to extend detection without
 * changing any detection logic.
 */

import type { FileAnalysis } from "../analyzer/types.js";
import type { LayerKind, ZoneKind } from "./types.js";

// ── Signal primitives ──────────────────────────────────────────────────────────

export type SignalKind =
  | "path-pattern"
  | "import-pattern"
  | "export-type"
  | "naming-convention"
  | "framework-hint"
  | "directive";

export interface Signal {
  kind: SignalKind;
  /** Human-readable description of what matched. */
  label: string;
  /** What the signal implies. */
  impliedZone: ZoneKind;
  impliedLayer: LayerKind;
  weight: number;
  source: string; // file path
}

export interface FileSignals {
  path: string;
  signals: Signal[];
  zoneVotes: Map<ZoneKind, number>;
  layerVotes: Map<LayerKind, number>;
}

// ── Rule tables ────────────────────────────────────────────────────────────────

export interface PathSignalRule {
  pattern: RegExp;
  zone: ZoneKind;
  layer: LayerKind;
  weight: number;
  label: string;
}

/**
 * Path-based signal rules.
 * Matched against the file's relative path (forward-slashes, lowercase).
 */
export const PATH_SIGNAL_RULES: PathSignalRule[] = [
  // ── Test files (highest priority — override everything else) ──────────────
  { pattern: /\.(test|spec)\.(tsx?|jsx?)$/, zone: "test", layer: "unknown", weight: 1.0, label: "test file extension" },
  { pattern: /\/__tests__\//, zone: "test", layer: "unknown", weight: 0.99, label: "__tests__ directory" },
  { pattern: /\/tests?\//, zone: "test", layer: "unknown", weight: 0.9, label: "test directory" },
  { pattern: /\/specs?\//, zone: "test", layer: "unknown", weight: 0.9, label: "spec directory" },
  { pattern: /\/e2e\//, zone: "test", layer: "unknown", weight: 0.9, label: "e2e directory" },
  { pattern: /\/cypress\//, zone: "test", layer: "unknown", weight: 0.95, label: "cypress directory" },
  { pattern: /\/playwright\//, zone: "test", layer: "unknown", weight: 0.95, label: "playwright directory" },

  // ── Config / build ────────────────────────────────────────────────────────
  { pattern: /\.(config|rc)\.(ts|js|cjs|mjs)$/, zone: "config", layer: "shared", weight: 0.85, label: "config file" },
  { pattern: /\/config\//, zone: "config", layer: "shared", weight: 0.75, label: "config directory" },
  { pattern: /\/scripts\//, zone: "config", layer: "shared", weight: 0.7, label: "scripts directory" },

  // ── Frontend / presentation ───────────────────────────────────────────────
  { pattern: /\/components?\//, zone: "frontend", layer: "presentation", weight: 0.85, label: "components directory" },
  { pattern: /\/pages?\//, zone: "frontend", layer: "presentation", weight: 0.85, label: "pages directory" },
  { pattern: /\/views?\//, zone: "frontend", layer: "presentation", weight: 0.8, label: "views directory" },
  { pattern: /\/layouts?\//, zone: "frontend", layer: "presentation", weight: 0.75, label: "layouts directory" },
  { pattern: /\/screens?\//, zone: "frontend", layer: "presentation", weight: 0.8, label: "screens directory" },
  { pattern: /\/ui\//, zone: "frontend", layer: "presentation", weight: 0.75, label: "ui directory" },
  { pattern: /\/widgets?\//, zone: "frontend", layer: "presentation", weight: 0.7, label: "widgets directory" },

  // ── Frontend / application ────────────────────────────────────────────────
  { pattern: /\/hooks?\//, zone: "frontend", layer: "application", weight: 0.75, label: "hooks directory" },
  { pattern: /\/containers?\//, zone: "frontend", layer: "application", weight: 0.6, label: "containers directory" },
  { pattern: /\/context\//, zone: "frontend", layer: "application", weight: 0.65, label: "context directory" },
  { pattern: /\/providers?\//, zone: "frontend", layer: "application", weight: 0.6, label: "providers directory" },
  { pattern: /\/stores?\//, zone: "frontend", layer: "application", weight: 0.65, label: "stores directory" },
  { pattern: /\/state\//, zone: "frontend", layer: "application", weight: 0.65, label: "state directory" },
  { pattern: /\/redux\//, zone: "frontend", layer: "application", weight: 0.8, label: "redux directory" },
  { pattern: /\/slices?\//, zone: "frontend", layer: "application", weight: 0.75, label: "slices directory" },

  // ── API layer ─────────────────────────────────────────────────────────────
  { pattern: /\/api\//, zone: "api", layer: "presentation", weight: 0.8, label: "api directory" },
  { pattern: /\/routes?\//, zone: "backend", layer: "presentation", weight: 0.75, label: "routes directory" },
  { pattern: /\/controllers?\//, zone: "backend", layer: "presentation", weight: 0.85, label: "controllers directory" },
  { pattern: /\/handlers?\//, zone: "backend", layer: "presentation", weight: 0.7, label: "handlers directory" },
  { pattern: /\/endpoints?\//, zone: "api", layer: "presentation", weight: 0.8, label: "endpoints directory" },
  { pattern: /\/resolvers?\//, zone: "api", layer: "presentation", weight: 0.75, label: "resolvers directory" },

  // ── Backend / application ─────────────────────────────────────────────────
  { pattern: /\/services?\//, zone: "backend", layer: "application", weight: 0.65, label: "services directory" },
  { pattern: /\/use-?cases?\//, zone: "backend", layer: "application", weight: 0.9, label: "use-cases directory" },
  { pattern: /\/commands?\//, zone: "backend", layer: "application", weight: 0.7, label: "commands directory" },
  { pattern: /\/queries\//, zone: "backend", layer: "application", weight: 0.7, label: "queries directory" },
  { pattern: /\/jobs?\//, zone: "backend", layer: "application", weight: 0.6, label: "jobs directory" },
  { pattern: /\/tasks?\//, zone: "backend", layer: "application", weight: 0.55, label: "tasks directory" },
  { pattern: /\/workers?\//, zone: "backend", layer: "application", weight: 0.6, label: "workers directory" },
  { pattern: /\/middleware\//, zone: "backend", layer: "application", weight: 0.65, label: "middleware directory" },

  // ── Domain ────────────────────────────────────────────────────────────────
  { pattern: /\/domain\//, zone: "backend", layer: "domain", weight: 0.95, label: "domain directory" },
  { pattern: /\/entities?\//, zone: "backend", layer: "domain", weight: 0.85, label: "entities directory" },
  { pattern: /\/models?\//, zone: "backend", layer: "domain", weight: 0.65, label: "models directory" },
  { pattern: /\/aggregates?\//, zone: "backend", layer: "domain", weight: 0.9, label: "aggregates directory" },
  { pattern: /\/value-?objects?\//, zone: "backend", layer: "domain", weight: 0.9, label: "value-objects directory" },
  { pattern: /\/business\//, zone: "backend", layer: "domain", weight: 0.85, label: "business directory" },

  // ── Infrastructure ────────────────────────────────────────────────────────
  { pattern: /\/repositor(y|ies)\//, zone: "backend", layer: "infrastructure", weight: 0.9, label: "repository directory" },
  { pattern: /\/database\/|\/db\//, zone: "backend", layer: "infrastructure", weight: 0.9, label: "database directory" },
  { pattern: /\/migrations?\//, zone: "backend", layer: "infrastructure", weight: 0.9, label: "migrations directory" },
  { pattern: /\/prisma\//, zone: "backend", layer: "infrastructure", weight: 0.9, label: "prisma directory" },
  { pattern: /\/adapters?\//, zone: "backend", layer: "infrastructure", weight: 0.8, label: "adapters directory" },
  { pattern: /\/ports?\//, zone: "backend", layer: "infrastructure", weight: 0.75, label: "ports directory" },
  { pattern: /\/clients?\//, zone: "backend", layer: "infrastructure", weight: 0.6, label: "clients directory" },
  { pattern: /\/integrations?\//, zone: "backend", layer: "infrastructure", weight: 0.7, label: "integrations directory" },
  { pattern: /\/external\//, zone: "backend", layer: "infrastructure", weight: 0.75, label: "external directory" },

  // ── Shared ────────────────────────────────────────────────────────────────
  { pattern: /\/shared\//, zone: "shared", layer: "shared", weight: 0.85, label: "shared directory" },
  { pattern: /\/common\//, zone: "shared", layer: "shared", weight: 0.75, label: "common directory" },
  { pattern: /\/lib\//, zone: "shared", layer: "shared", weight: 0.65, label: "lib directory" },
  { pattern: /\/utils?\//, zone: "shared", layer: "shared", weight: 0.7, label: "utils directory" },
  { pattern: /\/helpers?\//, zone: "shared", layer: "shared", weight: 0.65, label: "helpers directory" },
  { pattern: /\/constants?\//, zone: "shared", layer: "shared", weight: 0.75, label: "constants directory" },
  { pattern: /\/types?\//, zone: "shared", layer: "shared", weight: 0.7, label: "types directory" },
];

// ── Import signal rules ────────────────────────────────────────────────────────

export interface ImportSignalRule {
  pattern: RegExp;
  zone: ZoneKind;
  layer: LayerKind;
  weight: number;
  label: string;
}

/**
 * Import-based signal rules.
 * Matched against each import specifier.
 */
export const IMPORT_SIGNAL_RULES: ImportSignalRule[] = [
  // ── Frontend frameworks ───────────────────────────────────────────────────
  { pattern: /^react$|^react-dom$/, zone: "frontend", layer: "presentation", weight: 0.9, label: "React" },
  { pattern: /^vue$|^@vue\//, zone: "frontend", layer: "presentation", weight: 0.9, label: "Vue" },
  { pattern: /^svelte(\/|$)|^@sveltejs\//, zone: "frontend", layer: "presentation", weight: 0.9, label: "Svelte" },
  { pattern: /^@angular\//, zone: "frontend", layer: "presentation", weight: 0.9, label: "Angular" },
  { pattern: /^solid-js(\/|$)/, zone: "frontend", layer: "presentation", weight: 0.9, label: "SolidJS" },
  { pattern: /^preact(\/|$)/, zone: "frontend", layer: "presentation", weight: 0.9, label: "Preact" },
  { pattern: /^qwik(\/|$)|^@builder\.io\/qwik/, zone: "frontend", layer: "presentation", weight: 0.9, label: "Qwik" },

  // ── UI component libraries ────────────────────────────────────────────────
  { pattern: /^@mui\/|^@emotion\//, zone: "frontend", layer: "presentation", weight: 0.8, label: "MUI" },
  { pattern: /^@chakra-ui\//, zone: "frontend", layer: "presentation", weight: 0.8, label: "Chakra UI" },
  { pattern: /^@mantine\//, zone: "frontend", layer: "presentation", weight: 0.8, label: "Mantine" },
  { pattern: /^antd$|^@ant-design\//, zone: "frontend", layer: "presentation", weight: 0.8, label: "Ant Design" },
  { pattern: /^@radix-ui\//, zone: "frontend", layer: "presentation", weight: 0.8, label: "Radix UI" },
  { pattern: /^@headlessui\//, zone: "frontend", layer: "presentation", weight: 0.8, label: "Headless UI" },
  { pattern: /^shadcn\/|^@shadcn\//, zone: "frontend", layer: "presentation", weight: 0.8, label: "shadcn/ui" },
  { pattern: /^lucide-react$|^react-icons$/, zone: "frontend", layer: "presentation", weight: 0.75, label: "icon library" },

  // ── Frontend routing ──────────────────────────────────────────────────────
  { pattern: /^react-router|^@tanstack\/router/, zone: "frontend", layer: "application", weight: 0.75, label: "client router" },
  { pattern: /^next\/router$|^next\/navigation$/, zone: "frontend", layer: "application", weight: 0.75, label: "Next.js router" },
  { pattern: /^wouter$|^reach-router$/, zone: "frontend", layer: "application", weight: 0.75, label: "client router" },

  // ── State management ──────────────────────────────────────────────────────
  { pattern: /^redux$|^react-redux$|^@reduxjs\/toolkit$/, zone: "frontend", layer: "application", weight: 0.85, label: "Redux" },
  { pattern: /^zustand$/, zone: "frontend", layer: "application", weight: 0.85, label: "Zustand" },
  { pattern: /^jotai$/, zone: "frontend", layer: "application", weight: 0.85, label: "Jotai" },
  { pattern: /^recoil$/, zone: "frontend", layer: "application", weight: 0.85, label: "Recoil" },
  { pattern: /^mobx$|^mobx-react(-lite)?$/, zone: "frontend", layer: "application", weight: 0.85, label: "MobX" },
  { pattern: /^xstate$|^@xstate\//, zone: "frontend", layer: "application", weight: 0.8, label: "XState" },
  { pattern: /^pinia$/, zone: "frontend", layer: "application", weight: 0.85, label: "Pinia" },
  { pattern: /^vuex$/, zone: "frontend", layer: "application", weight: 0.85, label: "Vuex" },

  // ── Data fetching (usually frontend) ─────────────────────────────────────
  { pattern: /^@tanstack\/react-query$|^react-query$/, zone: "frontend", layer: "application", weight: 0.8, label: "React Query" },
  { pattern: /^swr$/, zone: "frontend", layer: "application", weight: 0.8, label: "SWR" },
  { pattern: /^@apollo\/client$/, zone: "frontend", layer: "application", weight: 0.75, label: "Apollo Client" },
  { pattern: /^graphql-request$/, zone: "frontend", layer: "application", weight: 0.7, label: "graphql-request" },

  // ── Backend frameworks ────────────────────────────────────────────────────
  { pattern: /^express$/, zone: "backend", layer: "presentation", weight: 0.9, label: "Express" },
  { pattern: /^fastify$/, zone: "backend", layer: "presentation", weight: 0.9, label: "Fastify" },
  { pattern: /^hono$/, zone: "backend", layer: "presentation", weight: 0.9, label: "Hono" },
  { pattern: /^koa$/, zone: "backend", layer: "presentation", weight: 0.9, label: "Koa" },
  { pattern: /^@nestjs\//, zone: "backend", layer: "presentation", weight: 0.9, label: "NestJS" },
  { pattern: /^elysia$/, zone: "backend", layer: "presentation", weight: 0.9, label: "Elysia" },
  { pattern: /^h3$/, zone: "backend", layer: "presentation", weight: 0.8, label: "H3 (Nitro)" },

  // ── tRPC ──────────────────────────────────────────────────────────────────
  { pattern: /^@trpc\//, zone: "api", layer: "presentation", weight: 0.85, label: "tRPC" },

  // ── GraphQL server ────────────────────────────────────────────────────────
  { pattern: /^graphql$|^@graphql-tools\/|^graphql-yoga$/, zone: "api", layer: "presentation", weight: 0.8, label: "GraphQL server" },
  { pattern: /^apollo-server/, zone: "api", layer: "presentation", weight: 0.85, label: "Apollo Server" },

  // ── ORMs / database ───────────────────────────────────────────────────────
  { pattern: /^@prisma\/client$|^prisma$/, zone: "backend", layer: "infrastructure", weight: 0.95, label: "Prisma" },
  { pattern: /^typeorm$/, zone: "backend", layer: "infrastructure", weight: 0.9, label: "TypeORM" },
  { pattern: /^drizzle-orm/, zone: "backend", layer: "infrastructure", weight: 0.9, label: "Drizzle ORM" },
  { pattern: /^mongoose$/, zone: "backend", layer: "infrastructure", weight: 0.9, label: "Mongoose" },
  { pattern: /^sequelize$/, zone: "backend", layer: "infrastructure", weight: 0.9, label: "Sequelize" },
  { pattern: /^mikro-orm\/|^@mikro-orm\//, zone: "backend", layer: "infrastructure", weight: 0.9, label: "MikroORM" },
  { pattern: /^pg$|^pg-pool$|^mysql2$|^sqlite3$|^better-sqlite3$/, zone: "backend", layer: "infrastructure", weight: 0.85, label: "DB driver" },
  { pattern: /^ioredis$|^redis$/, zone: "backend", layer: "infrastructure", weight: 0.8, label: "Redis client" },

  // ── Auth packages ─────────────────────────────────────────────────────────
  { pattern: /^next-auth$|^@auth\//, zone: "backend", layer: "infrastructure", weight: 0.9, label: "Auth.js" },
  { pattern: /^passport(\/|$)|^passport-/, zone: "backend", layer: "infrastructure", weight: 0.9, label: "Passport.js" },
  { pattern: /^jsonwebtoken$|^jose$|^@panva\/hkdf$/, zone: "backend", layer: "infrastructure", weight: 0.85, label: "JWT" },
  { pattern: /^bcrypt(js)?$|^argon2$|^scrypt$/, zone: "backend", layer: "infrastructure", weight: 0.8, label: "password hashing" },
  { pattern: /^@supabase\//, zone: "backend", layer: "infrastructure", weight: 0.85, label: "Supabase" },
  { pattern: /^firebase\/|^@firebase\//, zone: "backend", layer: "infrastructure", weight: 0.85, label: "Firebase" },
  { pattern: /^@clerk\//, zone: "backend", layer: "infrastructure", weight: 0.9, label: "Clerk" },
  { pattern: /^lucia$/, zone: "backend", layer: "infrastructure", weight: 0.9, label: "Lucia" },

  // ── Email / messaging ─────────────────────────────────────────────────────
  { pattern: /^nodemailer$|^@sendgrid\/|^resend$|^@resend\//, zone: "backend", layer: "infrastructure", weight: 0.8, label: "email service" },
  { pattern: /^@aws-sdk\//, zone: "backend", layer: "infrastructure", weight: 0.8, label: "AWS SDK" },
  { pattern: /^stripe$/, zone: "backend", layer: "infrastructure", weight: 0.8, label: "Stripe SDK" },

  // ── Node.js built-ins (backend signal) ───────────────────────────────────
  { pattern: /^node:(fs|path|os|crypto|child_process|worker_threads)/, zone: "backend", layer: "infrastructure", weight: 0.55, label: "Node.js built-in" },
  { pattern: /^node:(http|https|net|tls|dgram)/, zone: "backend", layer: "infrastructure", weight: 0.65, label: "Node.js net built-in" },
];

// ── Naming convention rules ────────────────────────────────────────────────────

export interface NamingRule {
  pattern: RegExp;
  /** Matched against class names, function names, file names. */
  matchTarget: "class" | "function" | "file" | "any";
  layer: LayerKind;
  zone: ZoneKind;
  weight: number;
  label: string;
}

export const NAMING_RULES: NamingRule[] = [
  // Presentation layer patterns
  { pattern: /Controller$/, matchTarget: "class", layer: "presentation", zone: "backend", weight: 0.8, label: "Controller suffix" },
  { pattern: /Router$|Routes?$/, matchTarget: "class", layer: "presentation", zone: "backend", weight: 0.75, label: "Router/Routes suffix" },
  { pattern: /^use[A-Z]/, matchTarget: "function", layer: "application", zone: "frontend", weight: 0.7, label: "React hook naming" },

  // Application layer patterns
  { pattern: /Service$/, matchTarget: "class", layer: "application", zone: "backend", weight: 0.75, label: "Service suffix" },
  { pattern: /UseCase$|Interactor$/, matchTarget: "class", layer: "application", zone: "backend", weight: 0.9, label: "UseCase/Interactor suffix" },
  { pattern: /Command$|Query$/, matchTarget: "class", layer: "application", zone: "backend", weight: 0.8, label: "Command/Query suffix" },
  { pattern: /Handler$/, matchTarget: "class", layer: "application", zone: "backend", weight: 0.7, label: "Handler suffix" },
  { pattern: /Manager$|Orchestrator$/, matchTarget: "class", layer: "application", zone: "backend", weight: 0.7, label: "Manager/Orchestrator suffix" },
  { pattern: /Facade$/, matchTarget: "class", layer: "application", zone: "backend", weight: 0.75, label: "Facade suffix" },

  // Domain layer patterns
  { pattern: /Entity$|Aggregate$/, matchTarget: "class", layer: "domain", zone: "backend", weight: 0.9, label: "Entity/Aggregate suffix" },
  { pattern: /ValueObject$|VO$/, matchTarget: "class", layer: "domain", zone: "backend", weight: 0.9, label: "ValueObject suffix" },
  { pattern: /DomainService$/, matchTarget: "class", layer: "domain", zone: "backend", weight: 0.9, label: "DomainService suffix" },
  { pattern: /Specification$|Spec$/, matchTarget: "class", layer: "domain", zone: "backend", weight: 0.85, label: "Specification suffix" },
  { pattern: /Policy$/, matchTarget: "class", layer: "domain", zone: "backend", weight: 0.7, label: "Policy suffix" },
  { pattern: /Factory$/, matchTarget: "class", layer: "domain", zone: "backend", weight: 0.65, label: "Factory suffix" },

  // Infrastructure layer patterns
  { pattern: /Repository$|Repo$/, matchTarget: "class", layer: "infrastructure", zone: "backend", weight: 0.9, label: "Repository suffix" },
  { pattern: /Adapter$|Gateway$/, matchTarget: "class", layer: "infrastructure", zone: "backend", weight: 0.85, label: "Adapter/Gateway suffix" },
  { pattern: /Client$/, matchTarget: "class", layer: "infrastructure", zone: "backend", weight: 0.6, label: "Client suffix" },
  { pattern: /Dao$|DAO$/, matchTarget: "class", layer: "infrastructure", zone: "backend", weight: 0.85, label: "DAO suffix" },

  // Shared layer patterns
  { pattern: /Utils?$|Helper$|Helpers$/, matchTarget: "any", layer: "shared", zone: "shared", weight: 0.7, label: "Utils/Helper suffix" },
  { pattern: /Constant$|Constants$/, matchTarget: "any", layer: "shared", zone: "shared", weight: 0.75, label: "Constants suffix" },
  { pattern: /Types?$/, matchTarget: "file", layer: "shared", zone: "shared", weight: 0.7, label: "Types file" },
];

// ── Per-file signal collection ─────────────────────────────────────────────────

export function collectFileSignals(
  analysis: FileAnalysis,
  root: string,
): FileSignals {
  const signals: Signal[] = [];
  const norm = analysis.relativePath.replace(/\\/g, "/").toLowerCase();
  const absNorm = analysis.path.replace(/\\/g, "/");

  // ── Path signals ───────────────────────────────────────────────────────────
  for (const rule of PATH_SIGNAL_RULES) {
    if (rule.pattern.test(norm) || rule.pattern.test(absNorm)) {
      signals.push({
        kind: "path-pattern",
        label: rule.label,
        impliedZone: rule.zone,
        impliedLayer: rule.layer,
        weight: rule.weight,
        source: analysis.path,
      });
    }
  }

  // ── Import signals ─────────────────────────────────────────────────────────
  const externalImports = analysis.imports.filter((i) => i.isExternal);
  for (const imp of externalImports) {
    for (const rule of IMPORT_SIGNAL_RULES) {
      if (rule.pattern.test(imp.specifier)) {
        signals.push({
          kind: "import-pattern",
          label: `imports ${rule.label}`,
          impliedZone: rule.zone,
          impliedLayer: rule.layer,
          weight: rule.weight,
          source: analysis.path,
        });
        break; // one match per import
      }
    }
  }

  // ── Export-type signals ────────────────────────────────────────────────────
  if (analysis.components.length > 0) {
    signals.push({
      kind: "export-type",
      label: `exports ${analysis.components.length} component(s)`,
      impliedZone: "frontend",
      impliedLayer: "presentation",
      weight: 0.7 * Math.min(1, analysis.components.length / 3),
      source: analysis.path,
    });
  }
  if (analysis.apiRoutes.length > 0) {
    signals.push({
      kind: "export-type",
      label: `defines ${analysis.apiRoutes.length} API route(s)`,
      impliedZone: "api",
      impliedLayer: "presentation",
      weight: 0.75 * Math.min(1, analysis.apiRoutes.length / 3),
      source: analysis.path,
    });
  }
  if (analysis.hooks.length > 0) {
    signals.push({
      kind: "export-type",
      label: `exports ${analysis.hooks.length} hook(s)`,
      impliedZone: "frontend",
      impliedLayer: "application",
      weight: 0.65,
      source: analysis.path,
    });
  }

  // ── Directive signals ──────────────────────────────────────────────────────
  if (analysis.directives.includes("use client")) {
    signals.push({
      kind: "directive",
      label: "'use client' directive",
      impliedZone: "frontend",
      impliedLayer: "presentation",
      weight: 0.95,
      source: analysis.path,
    });
  }
  if (analysis.directives.includes("use server")) {
    signals.push({
      kind: "directive",
      label: "'use server' directive",
      impliedZone: "backend",
      impliedLayer: "application",
      weight: 0.95,
      source: analysis.path,
    });
  }

  // ── Naming convention signals ──────────────────────────────────────────────
  const fileName = norm.split("/").pop() ?? "";
  for (const rule of NAMING_RULES) {
    const candidates: string[] = [];
    if (rule.matchTarget === "class" || rule.matchTarget === "any") {
      candidates.push(...analysis.classes.map((c) => c.name));
    }
    if (rule.matchTarget === "function" || rule.matchTarget === "any") {
      candidates.push(...analysis.functions.map((f) => f.name));
    }
    if (rule.matchTarget === "file" || rule.matchTarget === "any") {
      candidates.push(fileName);
    }
    if (candidates.some((c) => rule.pattern.test(c))) {
      signals.push({
        kind: "naming-convention",
        label: rule.label,
        impliedZone: rule.zone,
        impliedLayer: rule.layer,
        weight: rule.weight,
        source: analysis.path,
      });
    }
  }

  // ── Aggregate votes ────────────────────────────────────────────────────────
  const zoneVotes = aggregateVotes<ZoneKind>(signals, "impliedZone");
  const layerVotes = aggregateVotes<LayerKind>(signals, "impliedLayer");

  return { path: analysis.path, signals, zoneVotes, layerVotes };
}

export function collectAllSignals(
  files: Map<string, FileAnalysis>,
  root: string,
): Map<string, FileSignals> {
  const result = new Map<string, FileSignals>();
  for (const [path, analysis] of files) {
    result.set(path, collectFileSignals(analysis, root));
  }
  return result;
}

// ── Vote helpers ───────────────────────────────────────────────────────────────

function aggregateVotes<T extends string>(
  signals: Signal[],
  key: "impliedZone" | "impliedLayer",
): Map<T, number> {
  const votes = new Map<T, number>();
  for (const s of signals) {
    const k = s[key] as T;
    if (k === "unknown") continue;
    votes.set(k, (votes.get(k) ?? 0) + s.weight);
  }
  return votes;
}

export function winningVote<T extends string>(
  votes: Map<T, number>,
  fallback: T,
): { winner: T; confidence: number } {
  if (votes.size === 0) return { winner: fallback, confidence: 0 };
  let best: T = fallback;
  let bestScore = 0;
  let total = 0;
  for (const [k, v] of votes) {
    total += v;
    if (v > bestScore) {
      bestScore = v;
      best = k;
    }
  }
  return { winner: best, confidence: total > 0 ? bestScore / total : 0 };
}
