import path from "node:path";

import type { Command } from "commander";

import { withErrorHandling } from "../core/errors/handler.js";
import { generateDiagrams } from "../diagrams/index.js";
import type { DiagramType, MermaidTheme } from "../diagrams/types.js";
import { logger } from "../core/logger/index.js";
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

interface DiagramCommandOptions {
  output?: string;
  types?: string;
  direction?: string;
  maxNodes?: number;
  minConfidence?: number;
  skipAnalysis?: boolean;
  theme?: string;
  dryRun?: boolean;
}

const VALID_TYPES: DiagramType[] = [
  "architecture",
  "dependency",
  "request-flow",
  "module-relations",
];

export function registerDiagramCommand(program: Command): void {
  program
    .command("diagram [root]")
    .description("Generate Mermaid.js diagrams from source analysis")
    .option("-o, --output <path>", "Write output to this file  (default: stdout)")
    .option(
      "--types <list>",
      "Comma-separated types: architecture,dependency,request-flow,module-relations",
    )
    .option(
      "--direction <dir>",
      "Graph direction: TD | LR | BT | RL  (default: LR)",
    )
    .option(
      "--max-nodes <n>",
      "Max nodes to render in large graphs  (default: 80)",
      parseInt,
    )
    .option(
      "--min-confidence <n>",
      "Minimum confidence threshold for architecture inference  (default: 0.25)",
      parseFloat,
    )
    .option("--skip-analysis", "Skip AST analysis — renders structural diagrams only")
    .option(
      "--theme <theme>",
      "Mermaid theme: default | dark | forest | neutral  (default: default)",
    )
    .option("--dry-run", "Preview diagram types without rendering")
    .addHelpText(
      "after",
      `
Examples:
  ${formatCmd("docsmith diagram")}
  ${formatCmd("docsmith diagram ./my-project --output DIAGRAMS.md")}
  ${formatCmd("docsmith diagram --types architecture,dependency")}
  ${formatCmd("docsmith diagram --direction TD --max-nodes 50")}
  ${formatCmd("docsmith diagram --theme dark --output diagrams.md")}
`,
    )
    .action(
      withErrorHandling(async (root: string | undefined, opts: DiagramCommandOptions) => {
        const projectRoot = path.resolve(process.cwd(), root ?? ".");

        const types =
          opts.types !== undefined
            ? opts.types
                .split(",")
                .map((t) => t.trim())
                .filter((t): t is DiagramType => VALID_TYPES.includes(t as DiagramType))
            : undefined;

        const spinner = createSpinner(
          `Analysing ${colors.path(path.relative(process.cwd(), projectRoot) || ".")}…`,
        ).start();

        let result: Awaited<ReturnType<typeof generateDiagrams>>;

        try {
          result = await generateDiagrams(projectRoot, {
            ...(types !== undefined && { types }),
            ...(opts.direction !== undefined && {
              direction: opts.direction as "TD" | "LR" | "BT" | "RL",
            }),
            ...(opts.maxNodes !== undefined && { maxNodes: opts.maxNodes }),
            ...(opts.minConfidence !== undefined && { minConfidence: opts.minConfidence }),
            ...(opts.skipAnalysis !== undefined && { skipAnalysis: opts.skipAnalysis }),
            ...(opts.theme !== undefined && { theme: opts.theme as MermaidTheme }),
          });

          spinner.succeed(
            `Generated ${colors.accent(String(result.diagramCount))} diagram${result.diagramCount === 1 ? "" : "s"}`,
          );
        } catch (err) {
          spinner.fail("Analysis failed.");
          throw err;
        }

        if (opts.dryRun) {
          section("Dry run — diagrams preview");
          blank();
          for (const d of result.diagrams) {
            console.log(`  ${colors.accent(d.type.padEnd(20))}  ${colors.dim(d.title)}`);
          }
          blank();
          console.log(
            `  Re-run without ${formatCmd("--dry-run")} to generate the full output.`,
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
              `  Written to   ${formatPath(path.relative(process.cwd(), outPath))}`,
              `  Diagrams     ${result.diagramCount}`,
              `  Types        ${result.diagrams.map((d) => d.type).join(", ")}`,
            ],
            "Diagrams generated",
          );
          blank();
        } else {
          blank();
          console.log(result.content);
          blank();
          logger.debug(`Diagrams: ${result.diagramCount}`);
        }
      }, logger),
    );
}
