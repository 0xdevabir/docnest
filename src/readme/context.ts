import path from "node:path";

import { readFile } from "../utils/fs.js";
import { scanRepository } from "../scanner/index.js";
import type { ConfigFile } from "../scanner/types.js";
import type { PackageManager, ReadmeContext, ReadmeOptions } from "./types.js";

interface FullPackageJson {
  name?: string;
  version?: string;
  description?: string;
  license?: string;
  repository?: string | { type?: string; url?: string };
  homepage?: string;
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

export async function buildReadmeContext(
  root: string,
  opts: ReadmeOptions = {},
): Promise<ReadmeContext> {
  const [structure, fullPkg] = await Promise.all([
    scanRepository({ root }),
    readFullPackageJson(root),
  ]);

  const packageManager = detectPackageManager(structure.configs);

  const repo = fullPkg.repository;
  const repository =
    typeof repo === "string"
      ? repo
      : typeof repo === "object" && repo?.url
        ? repo.url.replace(/^git\+/, "").replace(/\.git$/, "")
        : undefined;

  let analysis: ReadmeContext["analysis"];
  let architecture: ReadmeContext["architecture"];
  let depGraph: ReadmeContext["depGraph"];

  if (!opts.skipAnalysis) {
    const sourceFiles = structure.files
      .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f.name))
      .map((f) => f.path);

    if (sourceFiles.length > 0) {
      const [
        { ASTAnalyzerService },
        { ArchitectureAnalyzerService },
        { buildDependencyGraph },
      ] = await Promise.all([
        import("../analyzer/service.js"),
        import("../architecture/service.js"),
        import("../dependency-graph/service.js"),
      ]);

      const astSvc = new ASTAnalyzerService();
      analysis = await astSvc.analyze({ root, files: sourceFiles });

      const archSvc = new ArchitectureAnalyzerService();
      architecture = archSvc.analyze(analysis, {
        root,
        ...(opts.minConfidence !== undefined && { minConfidence: opts.minConfidence }),
      });

      depGraph = buildDependencyGraph(analysis, root);
    }
  }

  const version = fullPkg.version ?? structure.packageJson?.version;
  const license =
    typeof fullPkg.license === "string" ? fullPkg.license : undefined;

  return {
    projectRoot: root,
    projectName:
      fullPkg.name ?? structure.packageJson?.name ?? path.basename(root),
    ...(fullPkg.description !== undefined && { projectDescription: fullPkg.description }),
    ...(version !== undefined && { version }),
    ...(license !== undefined && { license }),
    ...(repository !== undefined && { repository }),
    ...(fullPkg.homepage !== undefined && { homepage: fullPkg.homepage }),
    packageManager,
    structure,
    ...(analysis !== undefined && { analysis }),
    ...(architecture !== undefined && { architecture }),
    ...(depGraph !== undefined && { depGraph }),
  };
}
