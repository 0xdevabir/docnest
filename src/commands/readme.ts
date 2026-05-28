import path from "node:path";

import { type Command } from "commander";

import { withErrorHandling } from "../core/errors/handler.js";
import { logger } from "../core/logger/index.js";
import { generateReadme } from "../readme/index.js";
import { listTemplates } from "../readme/templates/index.js";
import { writeFile } from "../utils/fs.js";
import {
  blank,
  colors,
  createSpinner,
  formatCmd,
  formatPath,
  printBox,
  printInfo,
  section,
} from "../utils/terminal.js";

interface ReadmeCommandOptions {
  template?: string;
  output?: string;
  skipAnalysis?: boolean;
  minConfidence?: number;
  listTemplates?: boolean;
  dryRun?: boolean;
}

export function registerReadmeCommand(program: Command): void {
  program
    .command("readme [root]")
    .description(
      "Generate an intelligent README.md from repository analysis",
    )
    .option(
      "-t, --template <name>",
      "README template  (default | library | api | minimal)",
      "default",
    )
    .option(
      "-o, --output <path>",
      "Write output to this file  (default: stdout)",
    )
    .option(
      "--skip-analysis",
      "Skip AST analysis — faster but omits API routes and architecture",
    )
    .option(
      "--min-confidence <number>",
      "Minimum confidence threshold for architecture inference (0–1)",
      parseFloat,
    )
    .option("--list-templates", "List available templates and exit")
    .option("--dry-run", "Preview sections that would be generated without writing output")
    .addHelpText(
      "after",
      `
Examples:
  ${formatCmd("docsmith readme")}
  ${formatCmd("docsmith readme ./my-project --template library")}
  ${formatCmd("docsmith readme --output README.md")}
  ${formatCmd("docsmith readme --template api --skip-analysis")}
  ${formatCmd("docsmith readme --list-templates")}
`,
    )
    .action(
      withErrorHandling(async (root: string | undefined, opts: ReadmeCommandOptions) => {
        if (opts.listTemplates) {
          const templates = listTemplates();
          section("Available Templates");
          blank();
          for (const t of templates) {
            console.log(
              `  ${colors.accent(t.name.padEnd(12))}  ${colors.dim(t.description)}`,
            );
            console.log(
              `  ${colors.muted("Sections: " + t.sections.join(" → "))}`,
            );
            blank();
          }
          return;
        }

        const projectRoot = path.resolve(process.cwd(), root ?? ".");
        const templateName = opts.template ?? "default";

        const scanSpinner = createSpinner(
          `Scanning ${colors.path(path.relative(process.cwd(), projectRoot) || ".")}…`,
        ).start();

        let result: Awaited<ReturnType<typeof generateReadme>>;
        try {
          result = await generateReadme(projectRoot, {
            template: templateName,
            ...(opts.skipAnalysis !== undefined && { skipAnalysis: opts.skipAnalysis }),
            ...(opts.minConfidence !== undefined && { minConfidence: opts.minConfidence }),
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
          blank();
          for (const [i, sectionId] of result.sections.entries()) {
            console.log(
              `  ${colors.muted(String(i + 1).padStart(2, "0"))}  ${colors.accent(sectionId)}`,
            );
          }
          blank();
          printInfo(
            `Re-run without ${formatCmd("--dry-run")} to generate the full README.`,
          );
          blank();
          return;
        }

        if (opts.output) {
          const outPath = path.resolve(process.cwd(), opts.output);
          await writeFile(outPath, result.content);
          blank();
          printBox(
            [
              `  Written to  ${formatPath(path.relative(process.cwd(), outPath))}`,
              `  Template    ${colors.accent(result.templateUsed)}`,
              `  Sections    ${result.sections.join(", ")}`,
            ],
            "README generated",
          );
        } else {
          blank();
          console.log(result.content);
          blank();
          logger.debug(
            `Template: ${result.templateUsed}  Sections: ${result.sections.join(", ")}`,
          );
        }

        blank();
      }, logger),
    );
}
