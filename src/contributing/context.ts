import path from "node:path";
import { readFile } from "../utils/fs.js";
import { scanRepository } from "../scanner/index.js";
import type { ConfigFile } from "../scanner/types.js";
import type {
  ContributingContext,
  ContributingOptions,
  PackageManager,
} from "./types.js";

interface FullPackageJson {
  name?: string;
  version?: string;
  description?: string;
  license?: string;
  repository?: string | { type?: string; url?: string };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

async function readFullPackageJson(root: string): Promise<FullPackageJson> {
  try {
    const raw = await readFile(path.join(root, "package.json"));
    return JSON.parse(raw) as FullPackageJson;
  } catch {
    return {};
  }
}

function detectPackageManager(configs: ConfigFile[]): PackageManager {
  for (const cfg of configs) {
    if (cfg.type !== "lockfile") continue;
    const p = cfg.relativePath;
    if (p.includes("pnpm-lock")) return "pnpm";
    if (p.includes("bun.lock")) return "bun";
    if (p.includes("yarn.lock")) return "yarn";
  }
  return "npm";
}

function cmdFor(
  pm: PackageManager,
  scripts: Record<string, string>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    if (key in scripts) {
      return pm === "npm" ? `npm run ${key}` : `${pm} ${key}`;
    }
  }
  return undefined;
}

function resolveRepo(
  raw: string | { type?: string; url?: string } | undefined,
): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw.url) {
    return raw.url.replace(/^git\+/, "").replace(/\.git$/, "");
  }
  return undefined;
}

function detectCommitConvention(
  pkg: FullPackageJson,
  fileRelPaths: string[],
): ContributingContext["commitConvention"] {
  const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  if (
    "@commitlint/cli" in allDeps ||
    "@commitlint/config-conventional" in allDeps ||
    "commitlint" in allDeps
  ) {
    return "conventional";
  }
  if (fileRelPaths.some((p) => p.includes("commitlint"))) {
    return "conventional";
  }
  return "unknown";
}

export async function buildContributingContext(
  root: string,
  opts: ContributingOptions = {},
): Promise<ContributingContext> {
  const [structure, fullPkg] = await Promise.all([
    scanRepository({ root }),
    readFullPackageJson(root),
  ]);

  const pm = detectPackageManager(structure.configs);
  const scripts = fullPkg.scripts ?? {};
  const allDeps = {
    ...(fullPkg.dependencies ?? {}),
    ...(fullPkg.devDependencies ?? {}),
  };

  const hasLinting =
    structure.configs.some((c) => c.type === "eslint") ||
    "@biomejs/biome" in allDeps ||
    "biome" in allDeps ||
    !!(scripts["lint"] ?? scripts["lint:check"]);

  const hasFormatting =
    structure.configs.some((c) => c.type === "prettier") ||
    "@biomejs/biome" in allDeps ||
    "biome" in allDeps ||
    !!(scripts["format"] ?? scripts["fmt"]);

  const hasTests =
    structure.configs.some((c) => c.type === "vitest" || c.type === "jest") ||
    !!(scripts["test"] ?? scripts["test:unit"]);

  const hasCi = structure.configs.some((c) => c.type === "ci");

  const hasGitHooks =
    "husky" in allDeps || "lint-staged" in allDeps || "lefthook" in allDeps;

  const hasTypeCheck = structure.configs.some((c) => c.type === "tsconfig");

  const hasChangelog = structure.files.some((f) => /CHANGELOG/i.test(f.name));

  const resolvedRepo = resolveRepo(fullPkg.repository);

  const commitConvention = detectCommitConvention(
    fullPkg,
    structure.files.map((f) => f.relativePath),
  );

  let analysis: ContributingContext["analysis"];
  let architecture: ContributingContext["architecture"];

  if (!opts.skipAnalysis) {
    const sourceFiles = structure.files.filter((f) =>
      /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f.name),
    );
    if (sourceFiles.length > 0) {
      const [{ ASTAnalyzerService }, { ArchitectureAnalyzerService }] =
        await Promise.all([
          import("../analyzer/service.js"),
          import("../architecture/service.js"),
        ]);
      const astSvc = new ASTAnalyzerService();
      analysis = await astSvc.analyze({ root, files: sourceFiles.map((f) => f.path) });
      const archSvc = new ArchitectureAnalyzerService();
      architecture = archSvc.analyze(analysis, {
        root,
        ...(opts.minConfidence !== undefined && {
          minConfidence: opts.minConfidence,
        }),
      });
    }
  }

  const testCmd = cmdFor(pm, scripts, "test", "test:unit", "test:run");
  const buildCmd = cmdFor(pm, scripts, "build", "compile");
  const lintCmd = cmdFor(pm, scripts, "lint", "lint:check");
  const formatCmd = cmdFor(pm, scripts, "format", "fmt", "format:write");
  const typeCheckCmd = cmdFor(pm, scripts, "typecheck", "type-check", "check");
  const devCmd = cmdFor(pm, scripts, "dev", "start:dev", "develop", "start");

  return {
    projectRoot: root,
    projectName:
      fullPkg.name ?? structure.packageJson?.name ?? path.basename(root),
    ...(fullPkg.description !== undefined && {
      projectDescription: fullPkg.description,
    }),
    ...(fullPkg.version !== undefined && { version: fullPkg.version }),
    ...(typeof fullPkg.license === "string" && { license: fullPkg.license }),
    ...(resolvedRepo !== undefined && { repo: resolvedRepo }),
    packageManager: pm,
    structure,
    ...(analysis !== undefined && { analysis }),
    ...(architecture !== undefined && { architecture }),
    hasLinting,
    hasFormatting,
    hasTests,
    hasCi,
    hasGitHooks,
    hasTypeCheck,
    hasChangelog,
    commitConvention,
    ...(testCmd !== undefined && { testCmd }),
    ...(buildCmd !== undefined && { buildCmd }),
    ...(lintCmd !== undefined && { lintCmd }),
    ...(formatCmd !== undefined && { formatCmd }),
    ...(typeCheckCmd !== undefined && { typeCheckCmd }),
    ...(devCmd !== undefined && { devCmd }),
    isMonorepo: (structure.monorepo?.workspaces?.length ?? 0) > 0,
    mainBranch: "main",
  };
}
