import path from "node:path";

import { type Command } from "commander";

import type { AIProvider } from "../ai/index.js";
import { aiRegistry } from "../ai/index.js";
import { withErrorHandling } from "../core/errors/handler.js";
import { generateExplanation } from "../explain/index.js";
import type { ExplainSectionId } from "../explain/types.js";
import { logger } from "../core/logger/index.js";
import { readFile, writeFile } from "../utils/fs.js";
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
} from "../utils/terminal.js";

interface ExplainCommandOptions {
  provider?: string;
  format?: string;
  depth?: string;
  focus?: string;
  sections?: string;
  output?: string;
  skipAnalysis?: boolean;
  minConfidence?: number;
  dryRun?: boolean;
}

type ExplainDepth = "brief" | "standard" | "detailed";
type ExplainFormat = "text" | "markdown";

const VALID_SECTIONS: ExplainSectionId[] = [
  "purpose", "architecture", "modules", "auth", "api", "business-logic",
];

function toDepth(raw: string | undefined): ExplainDepth {
  if (raw === "brief" || raw === "standard" || raw === "detailed") return raw;
  return "standard";
}

function toFormat(raw: string | undefined): ExplainFormat {
  if (raw === "text" || raw === "markdown") return raw;
  return "markdown";
}

export function registerExplainCommand(program: Command): void {
  program
    .command("explain [file]")
    .description(
      "Explain a source file (explain <file>) or the entire repository (explain)",
    )
    .option(
      "-p, --provider <provider>",
      "AI provider  (openai | anthropic | ollama)",
    )
    .option("-f, --format <format>", "Output format  (text | markdown)", "markdown")
    .option(
      "-d, --depth <depth>",
      "Explanation depth  (brief | standard | detailed)",
      "standard",
    )
    .option("--focus <aspect>", 'Single-file: narrow explanation (e.g. "auth flow")')
    .option(
      "--sections <list>",
      "Repo: comma-separated sections — purpose,architecture,modules,auth,api,business-logic",
    )
    .option("-o, --output <path>", "Repo: write output to this file (default: stdout)")
    .option("--skip-analysis", "Repo: skip AST analysis (faster, less detail)")
    .option(
      "--min-confidence <n>",
      "Repo: architecture confidence threshold  (default: 0.25)",
      parseFloat,
    )
    .option("--dry-run", "Repo: preview section list without generating content")
    .addHelpText(
      "after",
      `
Single-file:
  ${formatCmd("docsmith explain src/auth/middleware.ts")}
  ${formatCmd('docsmith explain src/api.ts --depth detailed --focus "error handling"')}

Repository:
  ${formatCmd("docsmith explain")}
  ${formatCmd("docsmith explain ./my-project --provider anthropic")}
  ${formatCmd("docsmith explain --sections purpose,architecture,api")}
  ${formatCmd("docsmith explain --output EXPLANATION.md --depth detailed")}
`,
    )
    .action(
      withErrorHandling(async (file: string | undefined, opts: ExplainCommandOptions) => {
        if (file !== undefined) {
          await explainFile(file, opts);
        } else {
          await explainRepo(opts);
        }
      }, logger),
    );
}

// ── Single-file explain ───────────────────────────────────────────────────────

async function explainFile(file: string, opts: ExplainCommandOptions): Promise<void> {
  const filePath = path.resolve(process.cwd(), file);
  const providerName = (opts.provider ?? "anthropic") as AIProvider;
  const depth = toDepth(opts.depth);
  const format = toFormat(opts.format);

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

  if (!aiRegistry.hasAny()) {
    warnNoProvider();
    process.exit(1);
  }

  const explainSpinner = createSpinner(
    `Analysing with ${colors.accent(providerName)}  ${colors.muted(`[depth: ${depth}]`)}…`,
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
}

// ── Repository explain ────────────────────────────────────────────────────────

async function explainRepo(opts: ExplainCommandOptions): Promise<void> {
  const projectRoot = path.resolve(process.cwd(), ".");
  const depth = toDepth(opts.depth);

  const sections =
    opts.sections !== undefined
      ? opts.sections
          .split(",")
          .map((s) => s.trim())
          .filter((s): s is ExplainSectionId =>
            VALID_SECTIONS.includes(s as ExplainSectionId),
          )
      : undefined;

  if (opts.dryRun) {
    const list = sections ?? VALID_SECTIONS;
    section("Dry run — sections to generate");
    blank();
    for (const s of list) {
      console.log(`  ${colors.accent(s)}`);
    }
    blank();
    console.log(`  Re-run without ${formatCmd("--dry-run")} to generate the full explanation.`);
    blank();
    return;
  }

  // Resolve AI adapter — auto-pick first available if no --provider given
  let adapter: ReturnType<typeof aiRegistry.resolve> | undefined;
  const providerName = opts.provider;
  if (providerName !== undefined) {
    if (!aiRegistry.hasAny()) {
      warnNoProvider();
    } else {
      try {
        adapter = aiRegistry.resolve(providerName as AIProvider);
      } catch {
        printWarning(
          `Provider "${providerName}" not available — generating structured output.`,
        );
      }
    }
  } else {
    const available = aiRegistry.listAvailable();
    if (available.length > 0) {
      try { adapter = aiRegistry.resolve(available[0]!); } catch { /* no-op */ }
    }
  }

  const spinner = createSpinner(
    `Analysing ${colors.path(path.relative(process.cwd(), projectRoot) || ".")}…`,
  ).start();

  let result: Awaited<ReturnType<typeof generateExplanation>>;

  try {
    result = await generateExplanation(
      projectRoot,
      {
        ...(sections !== undefined && { sections }),
        depth,
        ...(opts.skipAnalysis !== undefined && { skipAnalysis: opts.skipAnalysis }),
        ...(opts.minConfidence !== undefined && { minConfidence: opts.minConfidence }),
      },
      adapter,
    );

    const aiNote =
      result.aiModel !== undefined
        ? `  ${colors.muted(`· ${result.aiProvider}/${result.aiModel}`)}`
        : `  ${colors.muted("· static analysis")}`;

    spinner.succeed(
      `Explained ${colors.accent(String(result.sections.length))} sections${aiNote}`,
    );
  } catch (err) {
    spinner.fail("Analysis failed.");
    throw err;
  }

  if (opts.output !== undefined) {
    const outPath = path.resolve(process.cwd(), opts.output);
    await writeFile(outPath, result.content);
    blank();
    printBox(
      [
        `  Written to   ${formatPath(path.relative(process.cwd(), outPath))}`,
        `  Sections     ${result.sections.length}`,
        `  AI sections  ${result.sections.filter((s) => s.aiGenerated).length} of ${result.sections.length}`,
        ...(result.aiModel !== undefined
          ? [`  Model        ${result.aiModel}`]
          : []),
      ],
      "Explanation generated",
    );
    blank();
  } else {
    blank();
    for (const sec of result.sections) {
      section(sec.title);
      blank();
      console.log(sec.content);
      blank();
      divider();
      blank();
    }
    if (result.aiModel !== undefined) {
      console.log(formatKey("Provider", colors.accent(result.aiProvider ?? "")));
      console.log(formatKey("Model", colors.muted(result.aiModel)));
    } else {
      console.log(
        colors.muted("  (structured analysis — configure an AI provider for prose summaries)"),
      );
    }
    blank();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function warnNoProvider(): void {
  blank();
  printWarning("No AI provider is configured.");
  blank();
  printBox(
    [
      "Set your API key:",
      `  ${colors.muted("ANTHROPIC_API_KEY=sk-ant-...")}`,
      `  ${colors.muted("OPENAI_API_KEY=sk-...")}`,
      "",
      "Register the adapter at startup:",
      `  ${formatCmd("aiRegistry.register(new AnthropicAdapter())")}`,
    ],
    "AI provider setup",
  );
  blank();
}
