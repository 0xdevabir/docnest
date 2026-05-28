import type { ReadmeContext, RenderedSection, SectionRenderer } from "../types.js";

const FRAMEWORK_BADGE: Record<string, string> = {
  next: "Next.js",
  vite: "Vite",
  astro: "Astro",
  remix: "Remix",
  nuxt: "Nuxt.js",
  svelte: "SvelteKit",
  angular: "Angular",
  react: "React",
  vue: "Vue.js",
  nest: "NestJS",
  express: "Express",
  fastify: "Fastify",
  prisma: "Prisma",
  tailwind: "Tailwind CSS",
  shadcn: "shadcn%2Fui",
  docker: "Docker",
  postgresql: "PostgreSQL",
  supabase: "Supabase",
};

const BADGE_COLOR: Record<string, string> = {
  next: "black",
  vite: "646CFF",
  astro: "FF5D01",
  remix: "000020",
  nuxt: "00DC82",
  svelte: "FF3E00",
  angular: "DD0031",
  react: "61DAFB",
  vue: "4FC08D",
  nest: "E0234E",
  express: "000000",
  fastify: "000000",
  prisma: "2D3748",
  tailwind: "06B6D4",
  shadcn: "000000",
  docker: "2496ED",
  postgresql: "4169E1",
  supabase: "3ECF8E",
};

export const overviewSection: SectionRenderer = {
  id: "overview",

  render(ctx: ReadmeContext): RenderedSection | null {
    const { projectName, projectDescription, version, license, structure } =
      ctx;
    const fw = structure.framework.primary;

    const lines: string[] = [];
    lines.push(`# ${projectName}`);
    lines.push("");

    const badges: string[] = [];
    if (version) {
      const safe = encodeURIComponent(version).replace(/-/g, "--");
      badges.push(`![Version](https://img.shields.io/badge/version-${safe}-blue.svg)`);
    }
    if (license) {
      const safe = encodeURIComponent(license).replace(/-/g, "--");
      badges.push(`![License](https://img.shields.io/badge/license-${safe}-green.svg)`);
    }
    if (fw !== "none" && FRAMEWORK_BADGE[fw]) {
      const label = FRAMEWORK_BADGE[fw];
      const color = BADGE_COLOR[fw] ?? "555";
      badges.push(
        `![${label}](https://img.shields.io/badge/${label}-${color}.svg?logo=${fw}&logoColor=white)`,
      );
    }

    if (badges.length > 0) {
      lines.push(badges.join(" "));
      lines.push("");
    }

    if (projectDescription) {
      lines.push(`> ${projectDescription}`);
      lines.push("");
    }

    if (ctx.homepage) {
      lines.push(`**Live:** [${ctx.homepage}](${ctx.homepage})`);
      lines.push("");
    }

    if (ctx.repository) {
      lines.push(`**Repo:** [${ctx.repository}](${ctx.repository})`);
      lines.push("");
    }

    return {
      id: "overview",
      title: projectName,
      content: lines.join("\n"),
    };
  },
};
