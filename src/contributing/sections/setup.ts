import type { ContributingContext, RenderedSection, SectionRenderer } from "../types.js";

const INSTALL_CMD: Record<string, string> = {
  pnpm: "pnpm install",
  yarn: "yarn install",
  npm: "npm install",
  bun: "bun install",
};

export const setupSection: SectionRenderer = {
  id: "setup",

  render(ctx: ContributingContext): RenderedSection | null {
    const { packageManager, structure, repo, devCmd, projectName } = ctx;
    const install = INSTALL_CMD[packageManager] ?? "npm install";
    const hasEnv = structure.configs.some((c) => c.type === "env");
    const hasTsConfig = structure.configs.some((c) => c.type === "tsconfig");
    const hasDocker = structure.configs.some((c) => c.type === "docker");

    const lines: string[] = [];
    lines.push("## Development Setup");
    lines.push("");

    const prereqs: string[] = [];
    if (packageManager !== "bun" || hasTsConfig) {
      prereqs.push("- [Node.js](https://nodejs.org) 18+");
    }
    if (packageManager === "pnpm") prereqs.push("- [pnpm](https://pnpm.io)");
    if (packageManager === "yarn") prereqs.push("- [Yarn](https://yarnpkg.com)");
    if (packageManager === "bun") prereqs.push("- [Bun](https://bun.sh)");
    if (hasDocker) prereqs.push("- [Docker](https://docker.com) (optional)");

    if (prereqs.length > 0) {
      lines.push("### Prerequisites");
      lines.push("");
      lines.push(...prereqs);
      lines.push("");
    }

    lines.push("### Steps");
    lines.push("");

    let step = 1;

    if (repo) {
      lines.push(`**${step++}.** Fork the repository on GitHub, then clone your fork:`);
    } else {
      lines.push(`**${step++}.** Clone the repository:`);
    }
    lines.push("");
    const cloneUrl = repo ?? `https://github.com/owner/${projectName}.git`;
    lines.push("```bash");
    lines.push(`git clone ${cloneUrl}`);
    lines.push(`cd ${projectName}`);
    lines.push("```");
    lines.push("");

    if (repo) {
      lines.push(`**${step++}.** Add the upstream remote:`);
      lines.push("");
      lines.push("```bash");
      lines.push(`git remote add upstream ${repo}`);
      lines.push("```");
      lines.push("");
    }

    lines.push(`**${step++}.** Install dependencies:`);
    lines.push("");
    lines.push("```bash");
    lines.push(install);
    lines.push("```");
    lines.push("");

    if (hasEnv) {
      const envFiles = structure.configs
        .filter((c) => c.type === "env")
        .map((c) => c.relativePath);
      const exampleFile = envFiles.find(
        (f) => f.includes("example") || f.includes("sample"),
      );
      lines.push(`**${step++}.** Configure environment variables:`);
      lines.push("");
      if (exampleFile) {
        lines.push("```bash");
        lines.push(`cp ${exampleFile} .env`);
        lines.push("```");
        lines.push("");
        lines.push("Edit `.env` and fill in the required values.");
      } else {
        lines.push("Create a `.env` file and populate the required variables.");
      }
      lines.push("");
    }

    if (devCmd) {
      lines.push(`**${step++}.** Start the development server:`);
      lines.push("");
      lines.push("```bash");
      lines.push(devCmd);
      lines.push("```");
      lines.push("");
    }

    return { id: "setup", title: "Development Setup", content: lines.join("\n") };
  },
};
