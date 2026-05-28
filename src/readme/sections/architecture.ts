import type { PatternKind, ZoneKind, LayerKind } from "../../architecture/types.js";
import type { ReadmeContext, RenderedSection, SectionRenderer } from "../types.js";

const PATTERN_DESCRIPTIONS: Partial<Record<PatternKind, string>> = {
  "feature-sliced":
    "Organises code by feature (app → pages → widgets → features → entities → shared).",
  "clean-architecture":
    "Strict layer isolation: domain → application → infrastructure → interface.",
  layered:
    "Classic N-tier: presentation → business logic → data access.",
  mvc: "Model–View–Controller separation of concerns.",
  hexagonal: "Core business logic surrounded by ports and adapters.",
  monorepo: "Multiple packages managed in a single repository.",
  microservices: "Independent services communicating over a network.",
  "modular-monolith":
    "Single deployable unit with clear internal module boundaries.",
  flat: "No discernible architectural pattern — ad-hoc file organisation.",
};

const ZONE_EMOJI: Record<ZoneKind, string> = {
  frontend: "🖥️",
  backend: "⚙️",
  api: "🔌",
  shared: "🔗",
  config: "🔧",
  infrastructure: "🏗️",
  test: "🧪",
  unknown: "📁",
};

const LAYER_LABEL: Record<LayerKind, string> = {
  presentation: "Presentation",
  application: "Application",
  domain: "Domain",
  infrastructure: "Infrastructure",
  shared: "Shared",
  unknown: "Unknown",
};

export const architectureSection: SectionRenderer = {
  id: "architecture",

  render(ctx: ReadmeContext): RenderedSection | null {
    const { architecture } = ctx;
    if (!architecture) return null;

    const topPattern = architecture.patterns
      .filter((p) => p.confidence >= 0.35 && p.kind !== "unknown")
      .sort((a, b) => b.confidence - a.confidence)[0];

    const significantZones = architecture.zones.filter(
      (z) => z.confidence >= 0.35 && z.kind !== "unknown" && z.files.length > 0,
    );
    const significantLayers = architecture.layers.filter(
      (l) => l.confidence >= 0.35 && l.kind !== "unknown",
    );

    if (!topPattern && significantZones.length === 0 && significantLayers.length === 0) {
      return null;
    }

    const lines: string[] = [];
    lines.push("## Architecture");
    lines.push("");

    if (topPattern) {
      lines.push(`**Pattern:** ${topPattern.label}`);
      lines.push("");
      const desc =
        PATTERN_DESCRIPTIONS[topPattern.kind] ?? topPattern.description;
      if (desc) {
        lines.push(`> ${desc}`);
        lines.push("");
      }
    }

    if (significantZones.length > 1) {
      lines.push("### Zones");
      lines.push("");
      for (const zone of significantZones) {
        const emoji = ZONE_EMOJI[zone.kind];
        const fileCount = zone.files.length;
        lines.push(
          `- ${emoji} **${zone.label}** — ${fileCount} file${fileCount !== 1 ? "s" : ""}`,
        );
      }
      lines.push("");
    }

    if (significantLayers.length > 1) {
      lines.push("### Layers");
      lines.push("");
      lines.push("| Layer | Confidence |");
      lines.push("|-------|-----------|");
      for (const layer of significantLayers.slice(0, 6)) {
        const label = LAYER_LABEL[layer.kind] ?? layer.label;
        const pct = Math.round(layer.confidence * 100);
        lines.push(`| ${label} | ${pct}% |`);
      }
      lines.push("");
    }

    if (architecture.coreModules.length > 0) {
      lines.push("### Core Modules");
      lines.push("");
      lines.push(
        "_Highly imported modules that form the backbone of the codebase:_",
      );
      lines.push("");
      for (const mod of architecture.coreModules.slice(0, 8)) {
        lines.push(
          `- \`${mod.relativePath}\` — imported by ${mod.consumerCount} module${mod.consumerCount !== 1 ? "s" : ""}`,
        );
      }
      lines.push("");
    }

    const domains = architecture.businessLogic
      .filter((b) => b.confidence >= 0.4)
      .slice(0, 6)
      .map((b) => b.name);

    if (domains.length > 0) {
      lines.push("### Business Domains");
      lines.push("");
      lines.push(domains.map((d) => `\`${d}\``).join(", "));
      lines.push("");
    }

    if (lines.length <= 3) return null;
    return {
      id: "architecture",
      title: "Architecture",
      content: lines.join("\n"),
    };
  },
};
