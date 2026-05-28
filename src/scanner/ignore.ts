// Dirs skipped during walking — O(1) Set lookup per entry.
const DEFAULT_IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  ".nuxt",
  "build",
  "coverage",
  ".turbo",
  ".nx",
  ".cache",
  ".parcel-cache",
  "out",
  ".output",
  ".vercel",
  ".netlify",
  "__pycache__",
  ".pytest_cache",
  "vendor",
  ".vendor",
  "bower_components",
  "jspm_packages",
  ".svelte-kit",
  "storybook-static",
  "tmp",
  "temp",
  ".tmp",
  ".temp",
]);

export class IgnoreSystem {
  private readonly dirs: Set<string>;

  constructor(extra: string[] = []) {
    this.dirs = new Set(DEFAULT_IGNORED_DIRS);
    for (const p of extra) {
      if (!p.includes("/") && !p.includes("*")) {
        this.dirs.add(p);
      }
    }
  }

  ignoresDir(name: string): boolean {
    return this.dirs.has(name);
  }

  get ignoredDirs(): ReadonlySet<string> {
    return this.dirs;
  }
}
