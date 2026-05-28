import path from "node:path";

import type { Command } from "commander";

import { withErrorHandling } from "../core/errors/handler.js";
import { logger } from "../core/logger/index.js";
import { generateApiDocs } from "../api-docs/index.js";
import { writeFile } from "../utils/fs.js";
import {
  blank,
  colors,
  createSpinner,
  formatCmd,
  formatPath,
  printBox,
  section,
} from "../utils/terminal.js";

interface ApiCommandOptions {
  output?: string;
  title?: string;
  baseUrl?: string;
  skipAnalysis?: boolean;
  dryRun?: boolean;
}

/**
 * `docsmith api [root]` — generate API.md from static route analysis.
 */
export function registerApiCommand(program: Command): void {
  program
    .command("api [root]")
    .description("Generate API reference documentation from source analysis")
    .option("-o, --output <path>", "Write output to this file (default: stdout)")
    .option("--title <title>", "Document title  (default: API Reference)")
    .option(
      "--base-url <url>",
      "Base URL prepended to route paths  (e.g. https://api.example.com)",
    )
    .option("--skip-analysis", "Skip AST analysis — reports structure only")
    .option("--dry-run", "Preview route count without rendering")
    .addHelpText(
      "after",
      `
Examples:
  ${formatCmd("docsmith api")}
  ${formatCmd("docsmith api ./my-project --output API.md")}
  ${formatCmd("docsmith api --base-url https://api.example.com --title 'My Service'")}
  ${formatCmd("docsmith api --skip-analysis")}
`,
    )
    .action(
      withErrorHandling(async (root: string | undefined, opts: ApiCommandOptions) => {
        const projectRoot = path.resolve(process.cwd(), root ?? ".");

        const spinner = createSpinner(
          `Analysing ${colors.path(path.relative(process.cwd(), projectRoot) || ".")}…`,
        ).start();

        let result: Awaited<ReturnType<typeof generateApiDocs>>;

        try {
          result = await generateApiDocs(projectRoot, {
            ...(opts.title !== undefined && { title: opts.title }),
            ...(opts.baseUrl !== undefined && { baseUrl: opts.baseUrl }),
            ...(opts.skipAnalysis !== undefined && { skipAnalysis: opts.skipAnalysis }),
          });

          spinner.succeed(
            `Found ${colors.accent(String(result.routeCount))} ` +
              `route${result.routeCount === 1 ? "" : "s"} in ` +
              `${result.tagCount} group${result.tagCount === 1 ? "" : "s"} · ` +
              `${colors.dim(result.framework)}`,
          );
        } catch (err) {
          spinner.fail("Analysis failed.");
          throw err;
        }

        if (opts.dryRun) {
          section("Dry run — route summary");
          blank();
          console.log(`  Routes found:  ${colors.accent(String(result.routeCount))}`);
          console.log(`  Route groups:  ${result.tagCount}`);
          console.log(`  Framework:     ${colors.dim(result.framework)}`);
          blank();
          console.log(
            `  Re-run without ${formatCmd("--dry-run")} to render full API docs.`,
          );
          blank();
          return;
        }

        if (opts.output !== undefined) {
          const outPath = path.resolve(process.cwd(), opts.output);
          await writeFile(outPath, result.content);
          blank();
          printBox(
            [
              `  Written to  ${formatPath(path.relative(process.cwd(), outPath))}`,
              `  Routes      ${result.routeCount}`,
              `  Groups      ${result.tagCount}`,
              `  Framework   ${result.framework}`,
            ],
            "API docs generated",
          );
          blank();
        } else {
          blank();
          console.log(result.content);
          blank();
          logger.debug(
            `Routes: ${result.routeCount}  Groups: ${result.tagCount}  Framework: ${result.framework}`,
          );
        }
      }, logger),
    );
}
