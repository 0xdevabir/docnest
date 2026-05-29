// Directory names skipped unconditionally during BFS — O(1) Set lookup.
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
  // DocSmith's own cache — never scan generated artefacts
  ".docsmith",
]);

export class IgnoreSystem {
  private readonly dirs: Set<string>;

  constructor(extra: string[] = []) {
    this.dirs = new Set(DEFAULT_IGNORED_DIRS);
    for (const p of extra) {
      // Only accept simple names (no glob, no path separators)
      if (!p.includes("/") && !p.includes("\\") && !p.includes("*")) {
        this.dirs.add(p);
      }
    }
  }

  /**
   * Parse a `.gitignore`-format string and extract directory-name entries.
   * Only simple unambiguous patterns are promoted to the ignore set; anything
   * containing wildcards, path separators, or negations is skipped.
   * We stay conservative: it is always safer to scan too much than too little.
   */
  applyGitIgnore(content: string): void {
    for (const raw of content.split(/\r?\n/)) {
      const line = raw.trim();

      if (line.length === 0 || line.startsWith("#") || line.startsWith("!")) continue;

      // Strip leading / (root-anchor) and trailing / (explicit-dir marker)
      const name = line.replace(/^\//, "").replace(/\/$/, "");

      if (
        name.length > 0 &&
        !name.includes("*") &&
        !name.includes("?") &&
        !name.includes("/") &&
        !name.includes("\\")
      ) {
        this.dirs.add(name);
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
