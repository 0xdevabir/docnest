import type { ReadmeContext, RenderedSection, SectionRenderer } from "../types.js";

const INSTALL_CMD: Record<string, string> = {
  pnpm: "pnpm install",
  yarn: "yarn",
  npm: "npm install",
  bun: "bun install",
};

const DEV_CMD: Record<string, string> = {
  pnpm: "pnpm dev",
  yarn: "yarn dev",
  npm: "npm run dev",
  bun: "bun dev",
};

export const setupSection: SectionRenderer = {
  id: "setup",

  render(ctx: ReadmeContext): RenderedSection | null {
    const { packageManager, structure, repository } = ctx;
    const { framework } = structure;
    const pkg = structure.packageJson;
    const scripts = pkg?.scripts ?? {};

    const install = INSTALL_CMD[packageManager];
    const hasEnv = structure.configs.some((c) => c.type === "env");
    const hasTsConfig = structure.configs.some((c) => c.type === "tsconfig");
    const hasDocker = structure.configs.some((c) => c.type === "docker");

    // Determine runtime prerequisite
    const needsNode = !["bun"].includes(packageManager) || hasTsConfig;
    const nodeVersion = (() => {
      const nvmrc = structure.configs.find((c) =>
        c.relativePath.includes(".nvmrc"),
      );
      if (nvmrc) return null; // caller reads .nvmrc
      return "18+";
    })();

    const lines: string[] = [];
    lines.push("## Getting Started");
    lines.push("");

    // Prerequisites
    const prereqs: string[] = [];
    if (needsNode) {
      prereqs.push(
        nodeVersion
          ? `- [Node.js](https://nodejs.org) ${nodeVersion}`
          : "- [Node.js](https://nodejs.org) (version from \`.nvmrc\`)",
      );
    }
    if (packageManager === "pnpm") prereqs.push("- [pnpm](https://pnpm.io)");
    if (packageManager === "yarn") prereqs.push("- [Yarn](https://yarnpkg.com)");
    if (packageManager === "bun") prereqs.push("- [Bun](https://bun.sh)");
    if (hasDocker) prereqs.push("- [Docker](https://docker.com)");

    if (prereqs.length > 0) {
      lines.push("### Prerequisites");
      lines.push("");
      lines.push(...prereqs);
      lines.push("");
    }

    // Installation steps
    lines.push("### Installation");
    lines.push("");

    const steps: string[] = [];

    if (repository) {
      steps.push(
        `\`\`\`bash\ngit clone ${repository}\ncd ${ctx.projectName}\n\`\`\``,
      );
    }

    steps.push(`\`\`\`bash\n${install}\n\`\`\``);

    if (hasEnv) {
      const envFiles = structure.configs
        .filter((c) => c.type === "env")
        .map((c) => c.relativePath);
      const exampleFile = envFiles.find(
        (f) => f.includes("example") || f.includes("sample"),
      );
      if (exampleFile) {
        steps.push(
          `Copy the environment template and fill in your values:\n\`\`\`bash\ncp ${exampleFile} .env\n\`\`\``,
        );
      } else {
        steps.push("Create a `.env` file based on the [Environment Variables](#environment-variables) section.");
      }
    }

    // DB setup if prisma
    if (framework.detected.some((f) => f.id === "prisma")) {
      const pushCmd =
        packageManager === "npm"
          ? "npx prisma db push"
          : `${packageManager} prisma db push`;
      steps.push(
        `Initialize the database:\n\`\`\`bash\n${pushCmd}\n\`\`\``,
      );
    }

    // Dev server
    const devScript = scripts["dev"] ?? scripts["start:dev"] ?? scripts["develop"];
    if (devScript !== undefined) {
      const devRun =
        packageManager === "npm"
          ? "npm run dev"
          : `${packageManager} dev`;
      steps.push(
        `Start the development server:\n\`\`\`bash\n${devRun}\n\`\`\``,
      );
    }

    steps.forEach((step, i) => {
      lines.push(`**${i + 1}.** ${step}`);
      lines.push("");
    });

    return { id: "setup", title: "Getting Started", content: lines.join("\n") };
  },
};
