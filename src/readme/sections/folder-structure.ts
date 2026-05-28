import path from "node:path";

import type { ZoneKind, LayerKind } from "../../architecture/types.js";
import type { ReadmeContext, RenderedSection, SectionRenderer } from "../types.js";

const KNOWN_DIR_LABELS: Record<string, string> = {
  src: "Application source code",
  app: "Next.js App Router / pages",
  pages: "Next.js / Nuxt.js pages",
  components: "Reusable UI components",
  features: "Feature modules",
  lib: "Shared utilities and helpers",
  hooks: "Custom React hooks",
  utils: "Utility functions",
  services: "Business logic services",
  api: "API route handlers",
  routes: "Route definitions",
  middleware: "Middleware functions",
  models: "Data models / entities",
  schemas: "Validation schemas",
  store: "State management store",
  stores: "State management stores",
  types: "TypeScript type definitions",
  styles: "Global styles",
  public: "Static assets (served directly)",
  assets: "Images, fonts, and other assets",
  config: "Configuration files",
  scripts: "Build and automation scripts",
  prisma: "Prisma schema and migrations",
  db: "Database migrations and seeds",
  migrations: "Database migrations",
  tests: "Test suites",
  test: "Test suites",
  __tests__: "Test suites",
  spec: "Test specifications",
  e2e: "End-to-end tests",
  docs: "Documentation",
  ".github": "GitHub Actions and templates",
  docker: "Docker configuration",
  infra: "Infrastructure configuration",
  i18n: "Internationalisation / translations",
  locales: "Translation files",
  server: "Server-side code",
  client: "Client-side code",
  shared: "Shared code across client and server",
  common: "Shared helpers and constants",
  core: "Core business logic",
  domain: "Domain models and rules",
  infrastructure: "External service adapters",
  plugins: "Plugin integrations",
  providers: "Context providers",
  contexts: "React contexts",
  layouts: "Page layouts",
  views: "View templates",
  controllers: "Request controllers",
  entities: "Domain entities",
  repositories: "Data repositories",
  guards: "Auth / access guards",
  decorators: "Custom decorators",
  interceptors: "NestJS interceptors",
  dto: "Data Transfer Objects",
  interfaces: "TypeScript interfaces",
  exceptions: "Custom exception classes",
  filters: "Exception filters",
  pipes: "Validation pipes",
};

const ZONE_DESCRIPTIONS: Record<ZoneKind, string> = {
  frontend: "Frontend / client-side",
  backend: "Backend / server-side",
  api: "API boundary layer",
  shared: "Shared across client and server",
  config: "Configuration and tooling",
  infrastructure: "Infrastructure and deployment",
  test: "Test suites",
  unknown: "",
};

const LAYER_DESCRIPTIONS: Record<LayerKind, string> = {
  presentation: "Presentation layer",
  application: "Application / use-case layer",
  domain: "Domain / business logic",
  infrastructure: "Infrastructure adapters",
  shared: "Shared utilities",
  unknown: "",
};

interface TreeNode {
  name: string;
  children: TreeNode[];
  fileCount: number;
}

function buildTree(
  relativePaths: string[],
  maxDepth: number,
): TreeNode {
  const root: TreeNode = { name: "", children: [], fileCount: 0 };

  for (const rp of relativePaths) {
    const parts = rp.split("/");
    let node = root;
    for (let i = 0; i < Math.min(parts.length, maxDepth + 1); i++) {
      const part = parts[i]!;
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, children: [], fileCount: 0 };
        node.children.push(child);
      }
      if (i === parts.length - 1) child.fileCount++;
      node = child;
    }
  }

  return root;
}

function renderTree(
  node: TreeNode,
  prefix: string,
  depth: number,
  maxDepth: number,
  annotations: Map<string, string>,
  dirPath: string,
): string[] {
  if (depth > maxDepth) return [];
  const lines: string[] = [];

  const sorted = [...node.children].sort((a, b) => {
    // Dirs first (have children), then files
    const aIsDir = a.children.length > 0;
    const bIsDir = b.children.length > 0;
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  sorted.forEach((child, i) => {
    const isLast = i === sorted.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPath = dirPath ? `${dirPath}/${child.name}` : child.name;
    const isDir = child.children.length > 0 || child.fileCount === 0;
    const label = isDir ? `${child.name}/` : child.name;

    const annotation = annotations.get(child.name) ?? annotations.get(childPath);
    const suffix = annotation ? `  # ${annotation}` : "";

    lines.push(`${prefix}${connector}${label}${suffix}`);

    if (isDir && depth < maxDepth) {
      const childPrefix = prefix + (isLast ? "    " : "│   ");
      lines.push(
        ...renderTree(child, childPrefix, depth + 1, maxDepth, annotations, childPath),
      );
    }
  });

  return lines;
}

export const folderStructureSection: SectionRenderer = {
  id: "folder-structure",

  render(ctx: ReadmeContext): RenderedSection | null {
    const { structure, architecture } = ctx;
    if (structure.files.length === 0) return null;

    const maxDepth = 2;

    // Build annotation map from architecture zones/layers
    const annotations = new Map<string, string>();

    // Static annotations from known directory names
    for (const [name, label] of Object.entries(KNOWN_DIR_LABELS)) {
      annotations.set(name, label);
    }

    // Architecture-derived annotations (override/supplement static ones)
    if (architecture) {
      for (const zone of architecture.zones) {
        if (zone.kind === "config" || zone.kind === "unknown" || !ZONE_DESCRIPTIONS[zone.kind]) continue;
        const desc = ZONE_DESCRIPTIONS[zone.kind];
        const dirs = new Set<string>();
        for (const fp of zone.files) {
          const rel = path.relative(ctx.projectRoot, fp);
          const topDir = rel.split("/")[0];
          if (topDir) dirs.add(topDir);
        }
        for (const dir of dirs) {
          if (!annotations.has(dir)) annotations.set(dir, desc);
        }
      }

      for (const feature of architecture.features.slice(0, 10)) {
        if (feature.rootDir) {
          const topDir = feature.rootDir.split("/")[0];
          if (topDir && !KNOWN_DIR_LABELS[topDir]) {
            annotations.set(topDir, "Feature module");
          }
        }
      }
    }

    const tree = buildTree(
      structure.files.map((f) => f.relativePath),
      maxDepth,
    );

    const treeLines = renderTree(tree, "", 0, maxDepth, annotations, "");
    if (treeLines.length === 0) return null;

    const lines: string[] = [];
    lines.push("## Folder Structure");
    lines.push("");
    lines.push("```");
    lines.push(".");
    lines.push(...treeLines);
    lines.push("```");
    lines.push("");

    return {
      id: "folder-structure",
      title: "Folder Structure",
      content: lines.join("\n"),
    };
  },
};
