import path from "node:path";

import { type Command } from "commander";

import type { AIProvider } from "../ai/index.js";
import { aiRegistry } from "../ai/index.js";
import { withErrorHandling } from "../core/errors/handler.js";
import { logger } from "../core/logger/index.js";
import { readFile } from "../utils/fs.js";
import {
  blank,
  colors,
  createSpinner,
  formatCmd,
  formatKey,
  formatPath,
  printBox,
  printInfo,
  printWarning,
  section,
  sym,
} from "../utils/terminal.js";

interface GenerateOptions {
  provider?: string;
  output?: string;
  template?: string;
  dryRun?: boolean;
  instructions?: string;
}

/**
 * `docsmith generate <source>` — generate documentation from a source file
 * using an AI provider.
 */
export function registerGenerateCommand(program: Command): void {
  program
    .command("generate <source>")
    .description("Generate documentation from a source file using AI")
    .option(
      "-p, --provider <provider>",
      "AI provider to use  (openai | anthropic | ollama)",
    )
    .option("-o, --output <path>", "Write output to this file instead of stdout")
    .option(
      "-t, --template <template>",
      'Output template  (api-reference | readme | changelog | custom)',
    )
    .option(
      "-i, --instructions <text>",
      "Extra instructions appended to the system prompt",
    )
    .option("--dry-run", "Preview the request without calling the AI provider")
    .addHelpText(
      "after",
      `
Examples:
  ${formatCmd("docsmith generate src/index.ts")}
  ${formatCmd("docsmith generate src/api.ts --provider anthropic --output docs/api.md")}
  ${formatCmd("docsmith generate src/auth.ts --template api-reference --dry-run")}
`,
    )
    .action(
      withErrorHandling(async (source: string, opts: GenerateOptions) => {
        const sourcePath = path.resolve(process.cwd(), source);
        const providerName = (opts.provider ?? "anthropic") as AIProvider;
        const isDryRun = opts.dryRun === true;

        // ── Read source ──────────────────────────────────────────────────────

        const readSpinner = createSpinner(
          `Reading ${colors.path(path.relative(process.cwd(), sourcePath))}…`,
        ).start();

        let content: string;
        try {
          content = await readFile(sourcePath);
          readSpinner.succeed(
            `${colors.dim("Source")}  ${formatPath(path.relative(process.cwd(), sourcePath))}  ${colors.muted(`(${content.length.toLocaleString()} chars)`)}`,
          );
        } catch {
          readSpinner.fail(`Cannot read source file: ${formatPath(sourcePath)}`);
          process.exit(1);
        }

        // ── Dry-run preview ──────────────────────────────────────────────────

        if (isDryRun) {
          section("Dry run — request preview");
          blank();
          console.log(formatKey("Source", formatPath(path.relative(process.cwd(), sourcePath))));
          console.log(formatKey("Provider", colors.accent(providerName)));
          console.log(formatKey("Template", opts.template ?? colors.muted("(none)")));
          console.log(formatKey("Output", opts.output !== undefined ? formatPath(opts.output) : colors.muted("stdout")));
          console.log(formatKey("Instructions", opts.instructions ?? colors.muted("(none)")));
          blank();
          printInfo("Re-run without " + formatCmd("--dry-run") + " to call the AI provider.");
          blank();
          return;
        }

        // ── Provider check ───────────────────────────────────────────────────

        if (!aiRegistry.hasAny()) {
          blank();
          printWarning("No AI provider is configured.");
          blank();
          printBox(
            [
              `${sym.bullet}  Install an adapter:`,
              `   ${formatCmd("pnpm add @docsmith/provider-anthropic")}`,
              `   ${formatCmd("pnpm add @docsmith/provider-openai")}`,
              `   ${formatCmd("pnpm add @docsmith/provider-ollama")}`,
              "",
              `${sym.bullet}  Then register it in ${formatPath("docsmith.config.js")}:`,
              `   ${colors.muted('import { AnthropicAdapter } from "@docsmith/provider-anthropic"')}`,
              `   ${colors.muted('aiRegistry.register(new AnthropicAdapter())')}`,
            ],
            "AI provider setup",
          );
          blank();
          process.exit(1);
        }

        // ── Generate ─────────────────────────────────────────────────────────

        const genSpinner = createSpinner(
          `Generating docs via ${colors.accent(providerName)}…`,
        ).start();

        try {
          const adapter = aiRegistry.resolve(providerName);
          const response = await adapter.generate({
            source: content,
            format: "markdown",
            ...(opts.template !== undefined && { template: opts.template }),
            ...(opts.instructions !== undefined && { instructions: opts.instructions }),
          });

          genSpinner.succeed(
            `Generated  ${colors.muted(`(${response.usage?.outputTokens ?? "?"} tokens)`)}`,
          );

          // ── Output ─────────────────────────────────────────────────────────

          if (opts.output !== undefined) {
            const { writeFile } = await import("../utils/fs.js");
            const outPath = path.resolve(process.cwd(), opts.output);
            await writeFile(outPath, response.content);
            blank();
            printBox(
              [
                `${sym.tick}  Output written to ${formatPath(path.relative(process.cwd(), outPath))}`,
                `   Provider  ${colors.accent(response.provider)}`,
                `   Model     ${colors.muted(response.model)}`,
              ],
              "Done",
            );
          } else {
            blank();
            console.log(response.content);
            blank();
            logger.debug(`Provider: ${response.provider}  Model: ${response.model}`);
          }
        } catch (error) {
          genSpinner.fail("Generation failed.");
          throw error;
        }

        blank();
      }, logger),
    );
}
