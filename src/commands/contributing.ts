import path from "node:path";
import type { Command } from "commander";
import { withErrorHandling } from "../core/errors/handler.js";
import { logger } from "../core/logger/index.js";
import { generateContributing } from "../contributing/index.js";
import { listTemplates } from "../contributing/templates/index.js";
import { writeFile } from "../utils/fs.js";
import {
  colors,
  createSpinner,
  divider,
  formatCmd,
  formatPath,
  section,
} from "../utils/terminal.js";

interface ContributingCommandOptions {
  template?: string;
  output?: string;
  skipAnalysis?: boolean;
  minConfidence?: number;
  listTemplates?: boolean;
  dryRun?: boolean;
}

export function registerContributingCommand(program: Command): void {
  program
    .command("contributing [root]")
    .description("Generate a CONTRIBUTING.md from repository analysis")
    .option(
      "-t, --template <name>",
      "Template to use  (default | minimal | library | app)",
    )
    .option(
      "-o, --output <file>",
      "Write output to this file  (default: stdout)",
    )
    .option("--skip-analysis", "Skip AST analysis — faster but less accurate")
    .option(
      "--min-confidence <num>",
      "Minimum confidence for architecture inference (0–1)",
      parseFloat,
    )
    .option("--list-templates", "List available templates and exit")
    .option("--dry-run", "Preview sections without generating output")
    .addHelpText(
      "after",
      `
Examples:
  ${formatCmd("docsmith contributing")}
  ${formatCmd("docsmith contributing ./my-project --template library")}
  ${formatCmd("docsmith contributing --output CONTRIBUTING.md")}
  ${formatCmd("docsmith contributing --list-templates")}`,
    )
    .action(
      withErrorHandling(
        async (
          root: string | undefined,
          opts: ContributingCommandOptions,
        ) => {
          if (opts.listTemplates) {
            const templates = listTemplates();
            section("Available Templates");
            for (const t of templates) {
              console.log(
                `  ${colors.accent(t.name.padEnd(12))}  ${colors.dim(t.desc)}`,
              );
              console.log(
                `  ${colors.muted("Sections: " + t.sections.join(" → "))}`,
              );
            }
            divider();
            return;
          }

          const projectRoot = path.resolve(process.cwd(), root ?? ".");
          const templateName = opts.template ?? "default";

          const scanSpinner = createSpinner(
            `Scanning ${colors.path(
              path.relative(process.cwd(), projectRoot) || ".",
            )}…`,
          );
          scanSpinner.start();

          let result: Awaited<ReturnType<typeof generateContributing>>;
          try {
            result = await generateContributing(projectRoot, {
              template: templateName,
              ...(opts.skipAnalysis !== undefined && {
                skipAnalysis: opts.skipAnalysis,
              }),
              ...(opts.minConfidence !== undefined && {
                minConfidence: opts.minConfidence,
              }),
            });
            scanSpinner.succeed(
              `Analysed  ${colors.dim(`template: ${result.templateUsed}`)}  ${colors.muted(`(${result.sections.length} sections)`)}`,
            );
          } catch (err) {
            scanSpinner.fail("Analysis failed.");
            throw err;
          }

          if (opts.dryRun) {
            section("Dry run — sections preview");
            for (const [i, sectionId] of result.sections.entries()) {
              console.log(
                `  ${colors.muted(String(i + 1).padStart(2, "0"))}  ${colors.accent(sectionId)}`,
              );
            }
            console.log(
              `\n  Re-run without ${formatCmd("--dry-run")} to generate the full CONTRIBUTING.md.`,
            );
            return;
          }

          if (opts.output) {
            const outPath = path.resolve(process.cwd(), opts.output);
            await writeFile(outPath, result.content);
            section("CONTRIBUTING.md generated");
            console.log(
              `  Written to  ${formatPath(path.relative(process.cwd(), outPath))}`,
            );
            console.log(`  Template    ${colors.accent(result.templateUsed)}`);
            console.log(`  Sections    ${result.sections.join(", ")}`);
          } else {
            console.log(result.content);
            logger.debug(
              `Template: ${result.templateUsed}  Sections: ${result.sections.join(", ")}`,
            );
          }
        },
        logger,
      ),
    );
}
