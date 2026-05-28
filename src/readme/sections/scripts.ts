import type { ReadmeContext, RenderedSection, SectionRenderer } from "../types.js";

interface ScriptMeta {
  description: string;
  category: "dev" | "build" | "test" | "deploy" | "lint" | "db" | "other";
}

const KNOWN_SCRIPTS: Record<string, ScriptMeta> = {
  dev: { description: "Start development server", category: "dev" },
  start: { description: "Start production server", category: "dev" },
  "start:dev": { description: "Start development server", category: "dev" },
  develop: { description: "Start development server", category: "dev" },
  build: { description: "Build for production", category: "build" },
  "build:prod": { description: "Build for production", category: "build" },
  preview: { description: "Preview production build", category: "build" },
  test: { description: "Run test suite", category: "test" },
  "test:watch": { description: "Run tests in watch mode", category: "test" },
  "test:coverage": { description: "Run tests with coverage", category: "test" },
  "test:e2e": { description: "Run end-to-end tests", category: "test" },
  lint: { description: "Lint source files", category: "lint" },
  "lint:fix": { description: "Lint and auto-fix issues", category: "lint" },
  format: { description: "Format source files", category: "lint" },
  typecheck: { description: "Type-check without emitting", category: "lint" },
  "type-check": { description: "Type-check without emitting", category: "lint" },
  deploy: { description: "Deploy application", category: "deploy" },
  "db:push": { description: "Push schema to database", category: "db" },
  "db:migrate": { description: "Run database migrations", category: "db" },
  "db:seed": { description: "Seed the database", category: "db" },
  "db:studio": { description: "Open database studio", category: "db" },
  "db:generate": { description: "Generate database client", category: "db" },
  generate: { description: "Generate code / types", category: "other" },
  clean: { description: "Clean build artifacts", category: "build" },
};

const SKIP = new Set([
  "postinstall", "prepare", "prepublish", "prepublishOnly",
  "preinstall", "postbuild", "prebuild",
]);

const CATEGORY_ORDER = ["dev", "build", "test", "lint", "db", "deploy", "other"] as const;

function inferDescription(name: string, command: string): string {
  if (command.includes("prisma migrate")) return "Run Prisma migrations";
  if (command.includes("prisma generate")) return "Generate Prisma client";
  if (command.includes("prisma studio")) return "Open Prisma Studio";
  if (command.includes("prisma db push")) return "Push schema to database";
  if (command.includes("drizzle-kit push")) return "Push schema to database";
  if (command.includes("drizzle-kit generate")) return "Generate Drizzle schema";
  if (command.includes("tsc")) return "Compile TypeScript";
  if (command.includes("vitest")) return "Run Vitest tests";
  if (command.includes("jest")) return "Run Jest tests";
  if (command.includes("playwright")) return "Run Playwright E2E tests";
  if (command.includes("eslint")) return "Lint with ESLint";
  if (command.includes("prettier")) return "Format with Prettier";
  if (command.includes("docker")) return "Docker operation";
  return `Run \`${command.slice(0, 40)}${command.length > 40 ? "…" : ""}\``;
}

function categorizeByCommand(
  command: string,
): ScriptMeta["category"] {
  if (/\b(dev|watch|serve|start)\b/.test(command) && /\b(next|vite|astro|nuxt|remix|ts-node|nodemon|tsx)\b/.test(command)) return "dev";
  if (/\b(build|compile|tsc|rollup|webpack|tsup|esbuild)\b/.test(command)) return "build";
  if (/\b(vitest|jest|mocha|playwright|cypress|ava)\b/.test(command)) return "test";
  if (/\b(eslint|prettier|biome|oxlint)\b/.test(command)) return "lint";
  if (/\b(prisma|drizzle-kit|migrate|seed|studio)\b/.test(command)) return "db";
  if (/\b(deploy|publish|release|ship)\b/.test(command)) return "deploy";
  return "other";
}

export const scriptsSection: SectionRenderer = {
  id: "scripts",

  render(ctx: ReadmeContext): RenderedSection | null {
    const pkg = ctx.structure.packageJson;
    if (!pkg?.scripts || Object.keys(pkg.scripts).length === 0) return null;

    const pm = ctx.packageManager;
    const runPrefix = pm === "npm" ? "npm run" : pm;

    const grouped = new Map<ScriptMeta["category"], Array<{ name: string; description: string }>>();
    for (const cat of CATEGORY_ORDER) grouped.set(cat, []);

    for (const [name, command] of Object.entries(pkg.scripts)) {
      if (SKIP.has(name) || name.startsWith("pre") || name.startsWith("post")) continue;

      const known = KNOWN_SCRIPTS[name];
      const description = known?.description ?? inferDescription(name, command);
      const category = known?.category ?? categorizeByCommand(command);

      grouped.get(category)!.push({ name, description });
    }

    const lines: string[] = [];
    lines.push("## Scripts");
    lines.push("");
    lines.push("| Command | Description |");
    lines.push("|---------|-------------|");

    for (const cat of CATEGORY_ORDER) {
      const entries = grouped.get(cat)!;
      if (entries.length === 0) continue;
      for (const { name, description } of entries) {
        lines.push(`| \`${runPrefix} ${name}\` | ${description} |`);
      }
    }

    if (lines.length <= 4) return null;
    return { id: "scripts", title: "Scripts", content: lines.join("\n") };
  },
};
