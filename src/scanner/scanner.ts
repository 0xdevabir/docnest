import path from "node:path";

import fs from "fs-extra";

import { ScanCache } from "./cache.js";
import { detectConfigs } from "./detectors/configs.js";
import { extractDependencies } from "./detectors/dependencies.js";
import { detectEntrypoints } from "./detectors/entrypoints.js";
import { detectFramework } from "./detectors/framework.js";
import { detectMonorepo } from "./detectors/monorepo.js";
import { extractScripts } from "./detectors/scripts.js";
import { getExtension } from "./file-utils.js";
import { IgnoreSystem } from "./ignore.js";
import type {
  FileEntry,
  PackageJson,
  ProjectStructure,
  ScanOptions,
} from "./types.js";

const DEFAULT_MAX_DEPTH = 20;
const DEFAULT_MAX_FILES = 50_000;
// Parallel readdir operations — keeps the OS page cache warm without
// overwhelming small SSDs or network filesystems.
const WALK_CONCURRENCY = 24;

// Module-level shared cache so repeated scans of the same repo are free.
const sharedCache = new ScanCache();

export class RepositoryScanner {
  private readonly cache: ScanCache;

  constructor(cache?: ScanCache) {
    this.cache = cache ?? sharedCache;
  }

  async scan(options: ScanOptions): Promise<ProjectStructure> {
    const root = path.resolve(options.root);
    const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
    const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
    const ignore = new IgnoreSystem(options.extraIgnores);

    let rootMtime: number;
    try {
      rootMtime = (await fs.stat(root)).mtimeMs;
    } catch {
      throw new Error(`Cannot access root directory: ${root}`);
    }

    const cached = this.cache.get(root, rootMtime);
    if (cached) return cached;

    const start = Date.now();

    const { files, totalDirs, skippedDirs } = await walkBFS(
      root,
      ignore,
      maxDepth,
      maxFiles,
      options.followSymlinks ?? false,
    );

    const rootPkgPath = path.join(root, "package.json");
    let rootPkg: PackageJson | null = null;
    try {
      rootPkg = await fs.readJson(rootPkgPath) as PackageJson;
    } catch {
      // No root package.json — valid for non-JS projects
    }

    const pkgSource = "package.json";

    const [monorepo, deps, scripts, entrypoints] = await Promise.all([
      detectMonorepo(root, rootPkg),
      Promise.resolve(rootPkg ? extractDependencies(rootPkg, pkgSource) : []),
      Promise.resolve(rootPkg ? extractScripts(rootPkg, pkgSource) : []),
      Promise.resolve(
        rootPkg ? detectEntrypoints(root, rootPkg, rootPkgPath) : [],
      ),
    ]);

    const configs = detectConfigs(files);
    const configFileNames = configs.map((c) => path.basename(c.path));
    const framework = detectFramework(deps, configFileNames);

    const result: ProjectStructure = {
      root,
      files,
      entrypoints,
      configs,
      dependencies: deps,
      scripts,
      monorepo,
      framework,
      packageJson: rootPkg,
      stats: {
        totalFiles: files.length,
        totalDirs,
        skippedDirs,
        durationMs: Date.now() - start,
      },
    };

    this.cache.set(root, rootMtime, result);
    return result;
  }

  invalidate(root: string): void {
    this.cache.invalidate(path.resolve(root));
  }

  clearCache(): void {
    this.cache.clear();
  }
}

async function walkBFS(
  root: string,
  ignore: IgnoreSystem,
  maxDepth: number,
  maxFiles: number,
  followSymlinks: boolean,
): Promise<{ files: FileEntry[]; totalDirs: number; skippedDirs: number }> {
  const files: FileEntry[] = [];
  let totalDirs = 0;
  let skippedDirs = 0;
  let fileCount = 0;

  // Queue entries: [absoluteDirPath, depth]
  const queue: Array<[string, number]> = [[root, 0]];
  const inFlight = new Set<Promise<void>>();

  const processDir = async (dirPath: string, depth: number): Promise<void> => {
    if (fileCount >= maxFiles) return;
    totalDirs++;

    let entries;
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return; // EACCES or other — skip silently
    }

    for (const entry of entries) {
      if (fileCount >= maxFiles) break;

      const name = entry.name;
      const fullPath = path.join(dirPath, name);

      if (entry.isDirectory()) {
        if (ignore.ignoresDir(name)) {
          skippedDirs++;
        } else if (depth < maxDepth) {
          queue.push([fullPath, depth + 1]);
        }
      } else if (entry.isFile() || (followSymlinks && entry.isSymbolicLink())) {
        files.push({
          path: fullPath,
          relativePath: path.relative(root, fullPath),
          name,
          ext: getExtension(name),
          size: 0,
          mtime: 0,
        });
        fileCount++;
      }
    }
  };

  const schedule = (dirPath: string, depth: number): void => {
    const p = processDir(dirPath, depth).finally(() => {
      inFlight.delete(p);
    });
    inFlight.add(p);
  };

  while (queue.length > 0 || inFlight.size > 0) {
    while (queue.length > 0 && inFlight.size < WALK_CONCURRENCY) {
      const [dirPath, depth] = queue.shift()!;
      schedule(dirPath, depth);
    }
    if (inFlight.size > 0) {
      await Promise.race(inFlight);
    }
  }

  return { files, totalDirs, skippedDirs };
}

export async function scanRepository(
  options: ScanOptions,
): Promise<ProjectStructure> {
  return new RepositoryScanner().scan(options);
}
