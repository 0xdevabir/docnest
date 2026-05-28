import type { ContributingContext, RenderedSection, SectionRenderer } from "../types.js";

const DIR_DESCRIPTIONS: Record<string, string> = {
  src: "All application source code",
  app: "App entry point / pages",
  components: "Reusable UI components",
  features: "Feature modules",
  lib: "Shared utilities",
  hooks: "Custom React hooks",
  utils: "Utility functions",
  services: "Business logic services",
  api: "API route handlers",
  routes: "Route definitions",
  middleware: "Middleware functions",
  models: "Data models",
  schemas: "Validation schemas",
  stores: "State management",
  types: "TypeScript type definitions",
  config: "Configuration files",
  scripts: "Build & automation scripts",
  prisma: "Prisma schema & migrations",
  tests: "Test suites",
  __tests__: "Test suites",
  e2e: "End-to-end tests",
  docs: "Documentation",
  ".github": "GitHub Actions & templates",
  docker: "Docker configuration",
  plugins: "Plugin integrations",
  commands: "CLI command handlers",
  cli: "CLI entry point",
  core: "Core utilities & infrastructure",
  scanner: "Repository scanning",
  analyzer: "Code analysis",
  architecture: "Architecture analysis",
  "dependency-graph": "Dependency graph engine",
  readme: "README generation",
  contributing: "CONTRIBUTING.md generation",
  "api-docs": "API documentation generation",
};

export const repoStructureSection: SectionRenderer = {
  id: "repo-structure",

  render(ctx: ContributingContext): RenderedSection | null {
    const { structure } = ctx;
    if (structure.files.length === 0) return null;

    const topDirs = new Set<string>();
    for (const f of structure.files) {
      const firstSegment = f.relativePath.split("/")[0];
      if (firstSegment && f.relativePath.includes("/")) {
        topDirs.add(firstSegment);
      }
    }

    if (topDirs.size === 0) return null;

    const lines: string[] = [];
    lines.push("## Repository Structure");
    lines.push("");
    lines.push(
      "A quick orientation of the repository layout to help you navigate the codebase:",
    );
    lines.push("");
    lines.push("```");

    const sorted = [...topDirs].sort((a, b) => {
      // src/ and app/ first, hidden dirs last
      const aHidden = a.startsWith(".");
      const bHidden = b.startsWith(".");
      if (aHidden !== bHidden) return aHidden ? 1 : -1;
      const priority = ["src", "app", "lib"];
      const ai = priority.indexOf(a);
      const bi = priority.indexOf(b);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.localeCompare(b);
    });

    for (const dir of sorted) {
      const desc = DIR_DESCRIPTIONS[dir];
      lines.push(`${dir}/${desc ? `  # ${desc}` : ""}`);
    }

    lines.push("```");
    lines.push("");
    lines.push(
      "For a deeper breakdown see the [Folder Structure](./README.md#folder-structure) section in the README.",
    );

    return {
      id: "repo-structure",
      title: "Repository Structure",
      content: lines.join("\n"),
    };
  },
};
