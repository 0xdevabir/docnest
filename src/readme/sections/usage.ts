import type { ReadmeContext, RenderedSection, SectionRenderer } from "../types.js";

const HTTP_METHOD_ORDER = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export const usageSection: SectionRenderer = {
  id: "usage",

  render(ctx: ReadmeContext): RenderedSection | null {
    const { structure, analysis } = ctx;
    const { entrypoints, framework } = structure;
    const lines: string[] = [];

    lines.push("## Usage");
    lines.push("");

    // Entry points
    if (entrypoints.length > 0) {
      lines.push("### Entry Points");
      lines.push("");
      for (const ep of entrypoints.slice(0, 5)) {
        const typeLabel =
          ep.type === "bin"
            ? "CLI binary"
            : ep.type === "main"
              ? "CommonJS entry"
              : ep.type === "module"
                ? "ESM entry"
                : ep.type === "exports"
                  ? "Package export"
                  : "Index";
        const nameSuffix = ep.name ? ` (\`${ep.name}\`)` : "";
        lines.push(`- **${typeLabel}${nameSuffix}:** \`${ep.relativePath}\``);
      }
      lines.push("");
    }

    // API routes — collected from all file analyses
    if (analysis) {
      const allRoutes: Array<{
        method: string;
        path: string;
        file: string;
      }> = [];

      for (const [filePath, fileAnalysis] of analysis.files) {
        const rel = fileAnalysis.relativePath;

        // Legacy flat apiRoutes
        for (const route of fileAnalysis.apiRoutes) {
          if (route.path) {
            allRoutes.push({
              method: route.method,
              path: route.path,
              file: rel,
            });
          }
        }

        // Rich route analysis
        if (fileAnalysis.routes?.routes?.length) {
          for (const routeEntry of fileAnalysis.routes.routes) {
            if (!routeEntry.path) continue;
            const method = routeEntry.methods[0] ?? "GET";
            const alreadyAdded = allRoutes.some(
              (r) => r.path === routeEntry.path && r.method === method && r.file === rel,
            );
            if (!alreadyAdded) {
              allRoutes.push({ method, path: routeEntry.path, file: rel });
            }
          }
        }
      }

      if (allRoutes.length > 0) {
        const sorted = allRoutes.sort((a, b) => {
          const mi =
            HTTP_METHOD_ORDER.indexOf(a.method as any) === -1
              ? 99
              : HTTP_METHOD_ORDER.indexOf(a.method as any);
          const mj =
            HTTP_METHOD_ORDER.indexOf(b.method as any) === -1
              ? 99
              : HTTP_METHOD_ORDER.indexOf(b.method as any);
          if (mi !== mj) return mi - mj;
          return a.path.localeCompare(b.path);
        });

        lines.push("### API Routes");
        lines.push("");
        lines.push("| Method | Path | File |");
        lines.push("|--------|------|------|");
        for (const r of sorted.slice(0, 20)) {
          lines.push(`| \`${r.method}\` | \`${r.path}\` | \`${r.file}\` |`);
        }
        if (sorted.length > 20) {
          lines.push(`| … | _${sorted.length - 20} more routes_ | |`);
        }
        lines.push("");
      }
    }

    // CLI usage (bin entries in package.json)
    const pkg = structure.packageJson;
    if (pkg?.bin) {
      lines.push("### CLI");
      lines.push("");
      if (typeof pkg.bin === "string") {
        lines.push(`\`\`\`bash\n${ctx.projectName} [options]\n\`\`\``);
      } else {
        for (const [binName] of Object.entries(pkg.bin)) {
          lines.push(`\`\`\`bash\n${binName} [options]\n\`\`\``);
        }
      }
      lines.push("");
    }

    // Framework-specific quick notes
    if (framework.primary === "next") {
      if (lines.length > 3) {
        lines.push(
          "> Pages in `app/` follow the [Next.js App Router](https://nextjs.org/docs/app) conventions.",
        );
        lines.push("");
      }
    } else if (framework.primary === "astro") {
      if (lines.length > 3) {
        lines.push(
          "> Pages in `src/pages/` are auto-routed following [Astro's file-based routing](https://docs.astro.build/en/core-concepts/routing/).",
        );
        lines.push("");
      }
    }

    if (lines.length <= 3) return null;
    return { id: "usage", title: "Usage", content: lines.join("\n") };
  },
};
