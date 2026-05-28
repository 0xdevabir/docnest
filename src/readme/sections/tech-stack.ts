import type { ReadmeContext, RenderedSection, SectionRenderer } from "../types.js";

const FRAMEWORK_LABEL: Record<string, string> = {
  next: "Next.js",
  vite: "Vite",
  astro: "Astro",
  remix: "Remix",
  nuxt: "Nuxt.js",
  svelte: "SvelteKit",
  angular: "Angular",
  react: "React",
  vue: "Vue.js",
  nest: "NestJS",
  express: "Express.js",
  fastify: "Fastify",
  prisma: "Prisma ORM",
  tailwind: "Tailwind CSS",
  shadcn: "shadcn/ui",
  docker: "Docker",
  postgresql: "PostgreSQL",
  supabase: "Supabase",
};

interface CategoryRule {
  pattern: RegExp;
  label: string;
}

const DEP_CATEGORIES: CategoryRule[] = [
  { pattern: /^(react|vue|svelte|@angular\/core|solid-js|preact|qwik)$/, label: "UI Framework" },
  { pattern: /^(zod|yup|joi|valibot|ajv|@vinxi\/schema)/, label: "Validation" },
  { pattern: /^(prisma|drizzle-orm|typeorm|sequelize|mongoose|knex|@planetscale|pg|mysql2|sqlite3|better-sqlite3)/, label: "Database / ORM" },
  { pattern: /^(jest|vitest|mocha|jasmine|playwright|cypress|@testing-library|supertest|@jest)/, label: "Testing" },
  { pattern: /^(zustand|mobx|jotai|recoil|redux|@reduxjs|pinia|valtio|@ngrx)/, label: "State Management" },
  { pattern: /^(axios|ky|got|node-fetch|ofetch|@tanstack\/query|swr|react-query)/, label: "HTTP / Data Fetching" },
  { pattern: /^(tailwindcss|@headlessui|framer-motion|lucide-react|@radix-ui|class-variance-authority|clsx|styled-components|@emotion)/, label: "Styling / UI" },
  { pattern: /^(lucia|next-auth|@auth\.|better-auth|passport|@hono\/oauth-providers)/, label: "Authentication" },
  { pattern: /^(stripe|@stripe)/, label: "Payments" },
  { pattern: /^(nodemailer|resend|@sendgrid|@aws-sdk\/client-ses)/, label: "Email" },
  { pattern: /^(openai|anthropic|@anthropic-ai|langchain|@langchain|ai)/, label: "AI / LLM" },
  { pattern: /^(graphql|@apollo\/|@urql\/|type-graphql|nexus)/, label: "GraphQL" },
  { pattern: /^(socket\.io|ws|uWebSockets|@hono\/node-ws)/, label: "WebSockets" },
  { pattern: /^(winston|pino|bunyan|consola|@logtail)/, label: "Logging" },
  { pattern: /^(commander|yargs|@clack\/|inquirer|meow|citty)/, label: "CLI" },
];

function categorize(name: string): string {
  for (const { pattern, label } of DEP_CATEGORIES) {
    if (pattern.test(name)) return label;
  }
  return "";
}

export const techStackSection: SectionRenderer = {
  id: "tech-stack",

  render(ctx: ReadmeContext): RenderedSection | null {
    const { structure } = ctx;
    const { framework, dependencies } = structure;

    const lines: string[] = [];
    lines.push("## Tech Stack");
    lines.push("");

    const coreFrameworks = framework.detected
      .filter((f) => f.confidence >= 0.35 && f.id !== "none")
      .slice(0, 6);

    if (coreFrameworks.length > 0) {
      lines.push("| Layer | Technology | Confidence |");
      lines.push("|-------|-----------|------------|");
      for (const fw of coreFrameworks) {
        const label = FRAMEWORK_LABEL[fw.id] ?? fw.name;
        const conf =
          fw.confidence >= 0.8
            ? "High"
            : fw.confidence >= 0.55
              ? "Medium"
              : "Low";
        const isPrimary = fw.id === framework.primary;
        lines.push(
          `| ${isPrimary ? "**Primary**" : "Secondary"} | ${isPrimary ? `**${label}**` : label} | ${conf} |`,
        );
      }
      lines.push("");
    }

    const prodDeps = dependencies.filter((d) => d.type === "prod");
    const devDeps = dependencies.filter((d) => d.type === "dev");

    const categorized = new Map<string, string[]>();
    for (const dep of prodDeps) {
      const cat = categorize(dep.name);
      if (!cat) continue;
      if (!categorized.has(cat)) categorized.set(cat, []);
      categorized.get(cat)!.push(`\`${dep.name}\``);
    }

    if (categorized.size > 0) {
      lines.push("### Dependencies");
      lines.push("");
      for (const [cat, deps] of categorized) {
        lines.push(`**${cat}:** ${deps.slice(0, 5).join(", ")}`);
        lines.push("");
      }
    }

    // Dev tooling summary
    const devTooling = devDeps
      .filter((d) => !categorize(d.name).includes("Test"))
      .map((d) => d.name)
      .filter((n) =>
        /^(typescript|eslint|prettier|tsx|ts-node|tsup|rollup|webpack|esbuild|vite|vitest|jest)/.test(
          n,
        ),
      )
      .slice(0, 6);

    if (devTooling.length > 0) {
      lines.push(
        `**Tooling:** ${devTooling.map((n) => `\`${n}\``).join(", ")}`,
      );
      lines.push("");
    }

    if (lines.length <= 3) return null;
    return { id: "tech-stack", title: "Tech Stack", content: lines.join("\n") };
  },
};
