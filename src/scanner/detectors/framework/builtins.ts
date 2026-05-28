import type { DetectedFramework } from "../../types.js";
import { combineWeights } from "./engine.js";
import type { DetectorContext, FrameworkDetector } from "./types.js";

interface Signal {
  weight: number;
  evidence: string;
}

function result(
  id: string,
  name: string,
  signals: Signal[],
): DetectedFramework | null {
  if (signals.length === 0) return null;
  return {
    id,
    name,
    confidence: combineWeights(signals.map((s) => s.weight)),
    evidence: signals.map((s) => s.evidence),
  };
}

// ─── Next.js ──────────────────────────────────────────────────────────────────

export const nextjsDetector: FrameworkDetector = {
  id: "next",
  name: "Next.js",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("next")) {
      signals.push({ weight: 0.75, evidence: "dep:next" });
    }
    for (const f of ["next.config.js", "next.config.ts", "next.config.mjs"]) {
      if (ctx.rootFiles.has(f) || ctx.configFiles.has(f)) {
        signals.push({ weight: 0.7, evidence: `config:${f}` });
        break;
      }
    }
    // App Router or Pages Router directory presence
    if (ctx.dirNames.has("app") || ctx.dirNames.has("pages")) {
      signals.push({ weight: 0.2, evidence: "dir:app|pages" });
    }

    return result("next", "Next.js", signals);
  },
};

// ─── React ────────────────────────────────────────────────────────────────────

export const reactDetector: FrameworkDetector = {
  id: "react",
  name: "React",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("react")) {
      signals.push({ weight: 0.6, evidence: "dep:react" });
    }
    if (ctx.deps.has("react-dom")) {
      signals.push({ weight: 0.4, evidence: "dep:react-dom" });
    }
    if (ctx.deps.has("@types/react") || ctx.devDeps.has("@types/react")) {
      signals.push({ weight: 0.3, evidence: "dep:@types/react" });
    }
    const hasJsx = ctx.filePaths.some(
      (p) => p.endsWith(".jsx") || p.endsWith(".tsx"),
    );
    if (hasJsx) {
      signals.push({ weight: 0.3, evidence: "files:*.jsx|*.tsx" });
    }

    return result("react", "React", signals);
  },
};

// ─── Express ──────────────────────────────────────────────────────────────────

export const expressDetector: FrameworkDetector = {
  id: "express",
  name: "Express",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("express")) {
      signals.push({ weight: 0.75, evidence: "dep:express" });
    }
    if (ctx.deps.has("@types/express") || ctx.devDeps.has("@types/express")) {
      signals.push({ weight: 0.4, evidence: "dep:@types/express" });
    }

    return result("express", "Express", signals);
  },
};

// ─── NestJS ───────────────────────────────────────────────────────────────────

export const nestjsDetector: FrameworkDetector = {
  id: "nest",
  name: "NestJS",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("@nestjs/core")) {
      signals.push({ weight: 0.8, evidence: "dep:@nestjs/core" });
    }
    if (ctx.deps.has("@nestjs/common")) {
      signals.push({ weight: 0.6, evidence: "dep:@nestjs/common" });
    }
    if (ctx.deps.has("@nestjs/platform-express")) {
      signals.push({ weight: 0.5, evidence: "dep:@nestjs/platform-express" });
    }
    if (ctx.rootFiles.has("nest-cli.json")) {
      signals.push({ weight: 0.7, evidence: "config:nest-cli.json" });
    }

    return result("nest", "NestJS", signals);
  },
};

// ─── Vite ─────────────────────────────────────────────────────────────────────

export const viteDetector: FrameworkDetector = {
  id: "vite",
  name: "Vite",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("vite") || ctx.devDeps.has("vite")) {
      signals.push({ weight: 0.65, evidence: "dep:vite" });
    }
    for (const f of ["vite.config.ts", "vite.config.js", "vite.config.mts"]) {
      if (ctx.rootFiles.has(f) || ctx.configFiles.has(f)) {
        signals.push({ weight: 0.65, evidence: `config:${f}` });
        break;
      }
    }

    return result("vite", "Vite", signals);
  },
};

// ─── Vue ──────────────────────────────────────────────────────────────────────

export const vueDetector: FrameworkDetector = {
  id: "vue",
  name: "Vue",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("vue")) {
      signals.push({ weight: 0.65, evidence: "dep:vue" });
    }
    if (ctx.deps.has("@vue/runtime-core") || ctx.deps.has("@vue/core")) {
      signals.push({ weight: 0.5, evidence: "dep:@vue/runtime-core" });
    }
    const hasVue = ctx.filePaths.some((p) => p.endsWith(".vue"));
    if (hasVue) {
      signals.push({ weight: 0.5, evidence: "files:*.vue" });
    }

    return result("vue", "Vue", signals);
  },
};

// ─── Prisma ───────────────────────────────────────────────────────────────────

export const prismaDetector: FrameworkDetector = {
  id: "prisma",
  name: "Prisma",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("@prisma/client")) {
      signals.push({ weight: 0.7, evidence: "dep:@prisma/client" });
    }
    if (ctx.deps.has("prisma") || ctx.devDeps.has("prisma")) {
      signals.push({ weight: 0.6, evidence: "dep:prisma" });
    }
    const hasSchema = ctx.filePaths.some((p) => p.endsWith("schema.prisma"));
    if (hasSchema) {
      signals.push({ weight: 0.75, evidence: "file:schema.prisma" });
    }
    if (ctx.dirNames.has("prisma")) {
      signals.push({ weight: 0.3, evidence: "dir:prisma" });
    }

    return result("prisma", "Prisma", signals);
  },
};

// ─── TailwindCSS ──────────────────────────────────────────────────────────────

export const tailwindDetector: FrameworkDetector = {
  id: "tailwind",
  name: "TailwindCSS",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("tailwindcss") || ctx.devDeps.has("tailwindcss")) {
      signals.push({ weight: 0.65, evidence: "dep:tailwindcss" });
    }
    for (const f of [
      "tailwind.config.js",
      "tailwind.config.ts",
      "tailwind.config.cjs",
      "tailwind.config.mjs",
    ]) {
      if (ctx.rootFiles.has(f) || ctx.configFiles.has(f)) {
        signals.push({ weight: 0.7, evidence: `config:${f}` });
        break;
      }
    }

    return result("tailwind", "TailwindCSS", signals);
  },
};

// ─── shadcn/ui ────────────────────────────────────────────────────────────────

export const shadcnDetector: FrameworkDetector = {
  id: "shadcn",
  name: "shadcn/ui",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    // shadcn/ui ships via CLI, not as an npm package — detect by artifacts.
    if (ctx.rootFiles.has("components.json")) {
      signals.push({ weight: 0.8, evidence: "config:components.json" });
    }
    const hasRadix = [...ctx.deps].some((d) => d.startsWith("@radix-ui/"));
    if (hasRadix) {
      signals.push({ weight: 0.4, evidence: "dep:@radix-ui/*" });
    }
    if (ctx.deps.has("class-variance-authority")) {
      signals.push({ weight: 0.4, evidence: "dep:class-variance-authority" });
    }
    if (ctx.deps.has("clsx") && ctx.deps.has("tailwind-merge")) {
      signals.push({ weight: 0.3, evidence: "dep:clsx+tailwind-merge" });
    }
    if (ctx.dirNames.has("ui")) {
      signals.push({ weight: 0.15, evidence: "dir:ui" });
    }

    return result("shadcn", "shadcn/ui", signals);
  },
};

// ─── Docker ───────────────────────────────────────────────────────────────────

export const dockerDetector: FrameworkDetector = {
  id: "docker",
  name: "Docker",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.rootFiles.has("Dockerfile")) {
      signals.push({ weight: 0.8, evidence: "file:Dockerfile" });
    }
    if (
      ctx.rootFiles.has("docker-compose.yml") ||
      ctx.rootFiles.has("docker-compose.yaml")
    ) {
      signals.push({ weight: 0.75, evidence: "file:docker-compose.yml" });
    }
    if (ctx.rootFiles.has(".dockerignore")) {
      signals.push({ weight: 0.4, evidence: "file:.dockerignore" });
    }
    // Dockerfile in a subdirectory
    const hasNestedDockerfile = ctx.filePaths.some(
      (p) =>
        !ctx.rootFiles.has(p) &&
        (p.includes("/Dockerfile") || p.endsWith(".dockerfile")),
    );
    if (hasNestedDockerfile) {
      signals.push({ weight: 0.4, evidence: "file:*/Dockerfile" });
    }

    return result("docker", "Docker", signals);
  },
};

// ─── PostgreSQL ───────────────────────────────────────────────────────────────

export const postgresqlDetector: FrameworkDetector = {
  id: "postgresql",
  name: "PostgreSQL",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("pg")) {
      signals.push({ weight: 0.7, evidence: "dep:pg" });
    }
    if (ctx.deps.has("@types/pg") || ctx.devDeps.has("@types/pg")) {
      signals.push({ weight: 0.4, evidence: "dep:@types/pg" });
    }
    if (ctx.deps.has("postgres")) {
      signals.push({ weight: 0.65, evidence: "dep:postgres" });
    }
    if (ctx.deps.has("pg-promise")) {
      signals.push({ weight: 0.6, evidence: "dep:pg-promise" });
    }
    if (ctx.deps.has("drizzle-orm")) {
      signals.push({ weight: 0.3, evidence: "dep:drizzle-orm" });
    }
    if (ctx.deps.has("knex")) {
      signals.push({ weight: 0.25, evidence: "dep:knex" });
    }

    return result("postgresql", "PostgreSQL", signals);
  },
};

// ─── Supabase ─────────────────────────────────────────────────────────────────

export const supabaseDetector: FrameworkDetector = {
  id: "supabase",
  name: "Supabase",
  detect(ctx: DetectorContext): DetectedFramework | null {
    const signals: Signal[] = [];

    if (ctx.deps.has("@supabase/supabase-js")) {
      signals.push({ weight: 0.85, evidence: "dep:@supabase/supabase-js" });
    }
    if (ctx.deps.has("@supabase/ssr")) {
      signals.push({ weight: 0.6, evidence: "dep:@supabase/ssr" });
    }
    if (ctx.deps.has("@supabase/auth-helpers-nextjs")) {
      signals.push({ weight: 0.5, evidence: "dep:@supabase/auth-helpers-nextjs" });
    }
    if (ctx.dirNames.has("supabase")) {
      signals.push({ weight: 0.5, evidence: "dir:supabase" });
    }
    const hasMigrations = ctx.filePaths.some((p) =>
      p.startsWith("supabase/migrations/"),
    );
    if (hasMigrations) {
      signals.push({ weight: 0.4, evidence: "dir:supabase/migrations" });
    }

    return result("supabase", "Supabase", signals);
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const BUILTIN_DETECTORS: readonly FrameworkDetector[] = [
  nextjsDetector,
  reactDetector,
  expressDetector,
  nestjsDetector,
  viteDetector,
  vueDetector,
  prismaDetector,
  tailwindDetector,
  shadcnDetector,
  dockerDetector,
  postgresqlDetector,
  supabaseDetector,
];
