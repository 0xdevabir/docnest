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
  divider,
  formatCmd,
  formatKey,
  formatPath,
  printBox,
  printWarning,
  section,
  sym,
} from "../utils/terminal.js";

interface ExplainOptions {
  provider?: string;
  format?: string;
  depth?: string;
  focus?: string;
}

type ExplainDepth = "brief" | "standard" | "detailed";
type ExplainFormat = "text" | "markdown";

function toDepth(raw: string | undefined): ExplainDepth {
  if (raw === "brief" || raw === "standard" || raw === "detailed") return raw;
  return "standard";
}

function toFormat(raw: string | undefined): ExplainFormat {
  if (raw === "text" || raw === "markdown") return raw;
  return "markdown";
}

/**
 * `docsmith explain <file>` — explain a source file using an AI provider.
 */
export function registerExplainCommand(program: Command): void {
  program
    .command("explain <file>")
    .description("Explain a source file or document using AI")
    .option(
      "-p, --provider <provider>",
      "AI provider to use  (openai | anthropic | ollama)",
    )
    .option(
      "-f, --format <format>",
      "Output format  (text | markdown)",
      "markdown",
    )
    .option(
      "-d, --depth <depth>",
      "Explanation depth  (brief | standard | detailed)",
      "standard",
    )
    .option(
      "--focus <aspect>",
      'Narrow the explanation (e.g. "authentication flow")',
    )
    .addHelpText(
      "after",
      `
Examples:
  ${formatCmd("docsmith explain src/auth/middleware.ts")}
  ${formatCmd("docsmith explain src/api.ts --depth detailed --provider openai")}
  ${formatCmd('docsmith explain docs/architecture.md --focus "data flow"')}
`,
    )
    .action(
      withErrorHandling(async (file: string, opts: ExplainOptions) => {
        const filePath = path.resolve(process.cwd(), file);
        const providerName = (opts.provider ?? "anthropic") as AIProvider;
        const depth = toDepth(opts.depth);
        const format = toFormat(opts.format);

        // ── Read file ────────────────────────────────────────────────────────

        const readSpinner = createSpinner(
          `Reading ${colors.path(path.relative(process.cwd(), filePath))}…`,
        ).start();

        let content: string;
        try {
          content = await readFile(filePath);
          readSpinner.succeed(
            `${colors.dim("File")}  ${formatPath(path.relative(process.cwd(), filePath))}  ${colors.muted(`(${content.split("\n").length} lines)`)}`,
          );
        } catch {
          readSpinner.fail(`Cannot read file: ${formatPath(filePath)}`);
          process.exit(1);
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
              `${sym.bullet}  Set your API key:`,
              `   ${colors.muted("ANTHROPIC_API_KEY=sk-ant-...")}`,
              `   ${colors.muted("OPENAI_API_KEY=sk-...")}`,
            ],
            "AI provider setup",
          );
          blank();
          process.exit(1);
        }

        // ── Explain ──────────────────────────────────────────────────────────

        const explainSpinner = createSpinner(
          `Analyzing with ${colors.accent(providerName)}  ${colors.muted(`[depth: ${depth}]`)}…`,
        ).start();

        try {
          const adapter = aiRegistry.resolve(providerName);
          const response = await adapter.explain({
            filePath,
            content,
            depth,
            format,
            ...(opts.focus !== undefined && { focus: opts.focus }),
          });

          explainSpinner.succeed(
            `Analysis complete  ${colors.muted(`(${response.usage?.outputTokens ?? "?"} tokens  ·  ${response.model})`)}`,
          );

          // ── Render output ──────────────────────────────────────────────────

          blank();
          section(`Explanation — ${path.basename(filePath)}`);
          blank();

          if (opts.focus !== undefined) {
            console.log(formatKey("Focus", colors.accent(opts.focus)));
            blank();
          }

          console.log(response.content);

          blank();
          divider();
          console.log(formatKey("Provider", colors.accent(response.provider)));
          console.log(formatKey("Model", colors.muted(response.model)));
          console.log(formatKey("Depth", colors.muted(depth)));
          blank();
        } catch (error) {
          explainSpinner.fail("Explanation failed.");
          throw error;
        }
      }, logger),
    );
}
