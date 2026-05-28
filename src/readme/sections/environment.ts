import path from "node:path";

import { readFile } from "../../utils/fs.js";
import type { ReadmeContext, RenderedSection, SectionRenderer } from "../types.js";

interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  example?: string;
}

const VAR_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /^DATABASE_URL$/, description: "Database connection string" },
  { pattern: /^(POSTGRES|PG)_(URL|HOST|PORT|DB|USER|PASSWORD|DATABASE)/, description: "PostgreSQL connection settings" },
  { pattern: /^MONGODB_URI$/, description: "MongoDB connection string" },
  { pattern: /^REDIS_(URL|HOST|PORT|PASSWORD)/, description: "Redis connection settings" },
  { pattern: /^(NEXTAUTH|AUTH)_SECRET$/, description: "Auth secret for session signing" },
  { pattern: /^(NEXTAUTH|AUTH)_URL$/, description: "Application base URL for auth callbacks" },
  { pattern: /^(NEXT_PUBLIC_|VITE_|PUBLIC_)?API_URL$/, description: "API base URL" },
  { pattern: /^(OPENAI|ANTHROPIC|GEMINI|MISTRAL)_API_KEY$/, description: "AI provider API key" },
  { pattern: /^STRIPE_(SECRET|PUBLISHABLE|WEBHOOK)_KEY/, description: "Stripe payment keys" },
  { pattern: /^(RESEND|SENDGRID|SMTP)_(API_KEY|HOST|PORT|USER|PASS)/, description: "Email service credentials" },
  { pattern: /^(AWS|S3)_(ACCESS_KEY|SECRET|BUCKET|REGION)/, description: "AWS / S3 credentials" },
  { pattern: /^JWT_(SECRET|EXPIRY|REFRESH)/, description: "JWT signing configuration" },
  { pattern: /^(PORT|HOST)$/, description: "Server listen address" },
  { pattern: /^NODE_ENV$/, description: "Runtime environment (development | production | test)" },
  { pattern: /^(NEXT_PUBLIC_|VITE_|PUBLIC_)?APP_URL$/, description: "Public application URL" },
  { pattern: /^(SUPABASE|FIREBASE|PB)_(URL|KEY|ANON_KEY|SERVICE_ROLE)/, description: "Backend-as-a-service credentials" },
  { pattern: /^GITHUB_(CLIENT_ID|CLIENT_SECRET|TOKEN)/, description: "GitHub OAuth / API credentials" },
  { pattern: /^GOOGLE_(CLIENT_ID|CLIENT_SECRET|API_KEY)/, description: "Google OAuth / API credentials" },
];

function describeVar(name: string): string {
  for (const { pattern, description } of VAR_PATTERNS) {
    if (pattern.test(name)) return description;
  }
  return name
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isRequired(name: string, value: string): boolean {
  if (value.startsWith("#")) return false;
  // Common optional vars
  const optional = /^(PORT|HOST|LOG_LEVEL|DEBUG|VERBOSE|NODE_OPTIONS)$/;
  if (optional.test(name)) return false;
  // Has a concrete default → optional
  if (value && !value.includes("your-") && !value.includes("<") && !value.includes("...")) {
    return false;
  }
  return true;
}

async function parseEnvFile(filePath: string): Promise<EnvVar[]> {
  try {
    const raw = await readFile(filePath);
    const vars: EnvVar[] = [];
    let lastComment = "";

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) {
        lastComment = trimmed.replace(/^#+\s*/, "");
        continue;
      }
      if (!trimmed || !trimmed.includes("=")) {
        lastComment = "";
        continue;
      }

      const eqIdx = trimmed.indexOf("=");
      const name = trimmed.slice(0, eqIdx).trim();
      const rawVal = trimmed.slice(eqIdx + 1).trim();

      if (!name || !/^[A-Z][A-Z0-9_]*$/.test(name)) {
        lastComment = "";
        continue;
      }

      const example =
        rawVal && !rawVal.includes("your-") ? rawVal.slice(0, 60) : undefined;
      vars.push({
        name,
        description: lastComment || describeVar(name),
        required: isRequired(name, rawVal),
        ...(example !== undefined && { example }),
      });
      lastComment = "";
    }

    return vars;
  } catch {
    return [];
  }
}

export const environmentSection: SectionRenderer = {
  id: "environment",

  render(ctx: ReadmeContext): RenderedSection | null {
    const { structure } = ctx;
    const envConfigs = structure.configs.filter((c) => c.type === "env");
    if (envConfigs.length === 0) return null;

    return {
      id: "environment",
      title: "Environment Variables",
      content: "## Environment Variables\n\n_Resolving…_",
    };
  },
};

/** Async version that reads env files — call instead of render() when async is available. */
export async function renderEnvironmentSection(
  ctx: ReadmeContext,
): Promise<RenderedSection | null> {
  const { structure } = ctx;
  const envConfigs = structure.configs.filter((c) => c.type === "env");
  if (envConfigs.length === 0) return null;

  // Prefer .env.example or .env.sample; fall back to .env
  const preferred =
    envConfigs.find(
      (c) =>
        c.relativePath.includes("example") ||
        c.relativePath.includes("sample") ||
        c.relativePath.includes("template"),
    ) ?? envConfigs[0];

  if (!preferred) return null;

  const vars = await parseEnvFile(path.join(ctx.projectRoot, preferred.relativePath));
  if (vars.length === 0) return null;

  const lines: string[] = [];
  lines.push("## Environment Variables");
  lines.push("");
  lines.push(`Configure environment variables by copying \`${preferred.relativePath}\` to \`.env\`:`);
  lines.push("");
  lines.push("```bash");
  lines.push(`cp ${preferred.relativePath} .env`);
  lines.push("```");
  lines.push("");
  lines.push("| Variable | Description | Required |");
  lines.push("|----------|-------------|----------|");

  for (const v of vars) {
    const req = v.required ? "✅ Yes" : "No";
    lines.push(`| \`${v.name}\` | ${v.description} | ${req} |`);
  }
  lines.push("");

  return {
    id: "environment",
    title: "Environment Variables",
    content: lines.join("\n"),
  };
}
