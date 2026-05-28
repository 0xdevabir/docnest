import path from "node:path";

import chalk from "chalk";
import { type Command } from "commander";
import ora from "ora";

import { withErrorHandling } from "../core/errors/handler.js";
import { logger } from "../core/logger/index.js";
import { pathExists, writeFile } from "../utils/fs.js";

interface InitOptions {
  name?: string;
  yes?: boolean;
}

const STARTER_CONFIG = (name: string) =>
  `/** @type {import('docsmith').DocSmithConfig} */
export default {
  name: "${name}",
  include: ["docs/**/*.md", "README.md"],
  output: {
    dir: "./docs-out",
    clean: true,
  },
  plugins: [],
};
`;

const STARTER_README = (name: string) =>
  `# ${name}

Welcome to your DocSmith project.

## Getting started

\`\`\`bash
pnpm docsmith build   # Build the documentation
pnpm docsmith serve   # Preview locally
\`\`\`

## Configuration

Edit \`docsmith.config.js\` to customise your project.
`;

/**
 * `docsmith init` — scaffold a new DocSmith project in the current directory.
 */
export function registerInitCommand(program: Command): void {
  program
    .command("init [directory]")
    .description("Initialise a new DocSmith project")
    .option("-n, --name <name>", "Project name")
    .option("-y, --yes", "Skip prompts and use defaults")
    .action(
      withErrorHandling(async (directory: string | undefined, opts: InitOptions) => {
        const targetDir = path.resolve(process.cwd(), directory ?? ".");
        const configPath = path.join(targetDir, "docsmith.config.js");

        if (await pathExists(configPath)) {
          logger.warn(
            `A docsmith.config.js already exists in ${targetDir}. Aborting.`,
          );
          process.exit(1);
        }

        const projectName =
          opts.name ?? path.basename(targetDir) ?? "my-docs";

        const spinner = ora("Scaffolding DocSmith project…").start();

        try {
          await writeFile(configPath, STARTER_CONFIG(projectName));
          await writeFile(
            path.join(targetDir, "docs", "index.md"),
            `# ${projectName}\n\nThis is the home page of your documentation.\n`,
          );
          await writeFile(path.join(targetDir, "README.md"), STARTER_README(projectName));

          spinner.succeed(chalk.green("Project initialised!"));
        } catch (error) {
          spinner.fail("Initialisation failed.");
          throw error;
        }

        console.log("");
        console.log("  Files created:");
        console.log(chalk.dim(`    ${path.relative(process.cwd(), configPath)}`));
        console.log(chalk.dim(`    docs/index.md`));
        console.log(chalk.dim(`    README.md`));
        console.log("");
        console.log("  Next steps:");
        console.log(chalk.cyan(`    docsmith build`));
        console.log("");
      }, logger),
    );
}
