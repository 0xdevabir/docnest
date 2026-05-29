import type { RouteEntry, RouteGroup } from "../../analyzer/routes/types.js";
import type { DiagramContext, DiagramResult } from "../types.js";
import { mermaidFence } from "../utils.js";

export function generateRequestFlowDiagram(ctx: DiagramContext): DiagramResult | null {
  const { analysis, options } = ctx;
  if (analysis === undefined) return null;

  const allGroups: Array<{ prefix: string; routes: RouteEntry[] }> = [];
  for (const fa of analysis.files.values()) {
    if (fa.routes.routes.length === 0) continue;
    if (fa.routes.groups.length > 0) {
      for (const g of fa.routes.groups) {
        flattenGroups(g, allGroups);
      }
    } else {
      allGroups.push({ prefix: "/", routes: fa.routes.routes });
    }
  }

  if (allGroups.length === 0) return null;

  const dir = options.direction ?? "LR";
  const lines: string[] = [`graph ${dir}`];
  let seq = 0;

  lines.push(`  _client(["Client"])`);

  const groupIds: string[] = [];

  for (const group of allGroups.slice(0, 10)) {
    const sgId = `sg${seq++}`;
    groupIds.push(sgId);

    lines.push(`  subgraph ${sgId}["${esc(group.prefix || "/")}"]`);

    for (const route of group.routes.slice(0, 6)) {
      const method = route.methods[0] ?? "GET";
      const routePath = route.path ?? "/";
      const rId = `r${seq++}`;
      const hId = `h${seq++}`;

      const authMw = route.middleware.filter(
        (m) => m.purpose === "auth" || m.purpose === "ratelimit",
      );

      lines.push(`    ${rId}["${method} ${esc(routePath)}"]`);

      if (authMw.length > 0) {
        const mwId = `mw${seq++}`;
        lines.push(`    ${mwId}{{"${esc(authMw.map((m) => m.name).join("+"))}"}}`);
        lines.push(`    ${hId}["${esc(route.handler)}()"]`);
        lines.push(`    ${rId} --> ${mwId} --> ${hId}`);
      } else {
        lines.push(`    ${hId}["${esc(route.handler)}()"]`);
        lines.push(`    ${rId} --> ${hId}`);
      }

      if (route.auth.protected) {
        lines.push(`    style ${rId} fill:#fef9c3,stroke:#d97706`);
      }
    }

    lines.push("  end");
  }

  for (const gId of groupIds) {
    lines.push(`  _client --> ${gId}`);
  }

  const mermaid = lines.join("\n");
  return {
    type: "request-flow",
    title: "Request Flow",
    mermaid,
    markdown: mermaidFence(mermaid),
  };
}

function flattenGroups(
  group: RouteGroup,
  out: Array<{ prefix: string; routes: RouteEntry[] }>,
): void {
  if (group.routes.length > 0) {
    out.push({ prefix: group.prefix, routes: group.routes });
  }
  for (const nested of group.nested) {
    flattenGroups(nested, out);
  }
}

function esc(s: string): string {
  return s.replace(/"/g, "'").replace(/[<>]/g, "");
}
