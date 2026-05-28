import path from "node:path";

import fs from "fs-extra";

import type {
  MonorepoInfo,
  MonorepoType,
  PackageJson,
  WorkspacePackage,
} from "../types.js";

interface WorkspaceSpec {
  type: MonorepoType;
  patterns: string[];
}

export async function detectMonorepo(
  root: string,
  rootPkg: PackageJson | null,
): Promise<MonorepoInfo> {
  const spec = await detectSpec(root, rootPkg);
  if (!spec) return { type: null, workspaces: [] };

  const workspaces = await resolveWorkspaces(root, spec.patterns);
  return { type: spec.type, workspaces };
}

async function detectSpec(
  root: string,
  pkg: PackageJson | null,
): Promise<WorkspaceSpec | null> {
  const [hasTurbo, hasNx, hasLerna, hasPnpmWorkspace] = await Promise.all([
    fs.pathExists(path.join(root, "turbo.json")),
    fs.pathExists(path.join(root, "nx.json")),
    fs.pathExists(path.join(root, "lerna.json")),
    fs.pathExists(path.join(root, "pnpm-workspace.yaml")),
  ]);

  if (hasTurbo) {
    return { type: "turborepo", patterns: extractPatterns(pkg) };
  }

  if (hasNx) {
    return { type: "nx", patterns: extractPatterns(pkg) };
  }

  if (hasLerna) {
    try {
      const lerna = await fs.readJson(
        path.join(root, "lerna.json"),
      ) as { packages?: string[] };
      return { type: "lerna", patterns: lerna.packages ?? ["packages/*"] };
    } catch {
      return { type: "lerna", patterns: ["packages/*"] };
    }
  }

  if (hasPnpmWorkspace) {
    try {
      const content = await fs.readFile(
        path.join(root, "pnpm-workspace.yaml"),
        "utf8",
      );
      return { type: "pnpm", patterns: parsePnpmYaml(content) };
    } catch {
      return { type: "pnpm", patterns: ["packages/*"] };
    }
  }

  // npm / yarn workspaces in package.json
  const patterns = extractPatterns(pkg);
  if (pkg?.workspaces && patterns.length > 0) {
    return { type: "yarn", patterns };
  }

  return null;
}

function extractPatterns(pkg: PackageJson | null): string[] {
  if (!pkg?.workspaces) return ["packages/*"];
  if (Array.isArray(pkg.workspaces)) return pkg.workspaces;
  return (pkg.workspaces as { packages: string[] }).packages ?? ["packages/*"];
}

function parsePnpmYaml(content: string): string[] {
  const patterns: string[] = [];
  let inPackages = false;

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (line === "packages:") {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      if (line.startsWith("-")) {
        patterns.push(line.slice(1).trim().replace(/^['"]|['"]$/g, ""));
      } else if (line && !line.startsWith("#")) {
        inPackages = false;
      }
    }
  }

  return patterns.length > 0 ? patterns : ["packages/*"];
}

async function resolveWorkspaces(
  root: string,
  patterns: string[],
): Promise<WorkspacePackage[]> {
  const results = await Promise.all(patterns.map((p) => resolvePattern(root, p)));
  return results.flat();
}

async function resolvePattern(
  root: string,
  pattern: string,
): Promise<WorkspacePackage[]> {
  const parts = pattern.split("/");
  const isGlob = parts[parts.length - 1] === "*";

  if (!isGlob) {
    return resolveExact(root, pattern);
  }

  const parentDir = path.join(root, ...parts.slice(0, -1));
  let entries;
  try {
    entries = await fs.readdir(parentDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const resolved = await Promise.all(
    entries
      .filter((e) => e.isDirectory())
      .map((e) => resolveExact(root, path.join(...parts.slice(0, -1), e.name))),
  );
  return resolved.flat();
}

async function resolveExact(
  root: string,
  relDir: string,
): Promise<WorkspacePackage[]> {
  const pkgDir = path.join(root, relDir);
  const pkgJsonPath = path.join(pkgDir, "package.json");
  try {
    const pkgJson = await fs.readJson(pkgJsonPath) as PackageJson;
    return [
      {
        name: pkgJson.name ?? path.basename(relDir),
        path: pkgDir,
        relativePath: relDir,
        packageJson: pkgJson,
      },
    ];
  } catch {
    return [];
  }
}
