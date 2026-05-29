import path from "node:path";

import { type Command } from "commander";

import { withErrorHandling } from "../core/errors/handler.js";
import { logger } from "../core/logger/index.js";
import { WatchPipeline } from "../watch/index.js";
import type {
  ChangeBatch,
  GenerateTarget,
  RebuildResult,
  WatchPhase,
  WatchStats,
} from "../watch/types.js";
import {
  blank,
  colors,
  createSpinner,
  divider,
  formatCmd,
  formatKey,
  formatPath,
  printBox,
  printError,
  printInfo,
  printSuccess,
  printWarning,
  section,
  sym,
} from "../utils/terminal.js";

interface WatchCommandOptions {
  debounce?: string;
  ignore?: string[];
  generate?: string;
  output?: string;
  verbose?: boolean;
}

const VALID_TARGETS: GenerateTarget[] = ["readme", "api", "contributing", "diagrams"];

export function registerWatchCommand(program: Command): void {
  program
    .command("watch [root]")
    .description("Watch source files and incrementally regenerate documentation")
    .option(
      "--debounce <ms>",
      "Quiet window before a rebuild fires  (default: 300)",
      "300",
    )
    .option(
      "--ignore <dir>",
      "Extra directory name to exclude (repeatable)",
      collect,
      [] as string[],
    )
    .option(
      "--generate <targets>",
      "Comma-separated generators: readme,api,contributing,diagrams  (default: readme)",
      "readme",
    )
    .option(
      "--output <path>",
      "Output file for the first generator target  (default: README.md)",
    )
    .option("--verbose", "Print per-file change details")
    .addHelpText(
      "after",
      `
Examples:
  ${formatCmd("docsmith watch")}
  ${formatCmd("docsmith watch --generate readme,api")}
  ${formatCmd("docsmith watch --debounce 500 --verbose")}
  ${formatCmd("docsmith watch ./my-project --output docs/README.md")}
`,
    )
    .action(
      withErrorHandling(async (root: string | undefined, opts: WatchCommandOptions) => {
        const projectRoot = path.resolve(process.cwd(), root ?? ".");
        const debounceMs = Math.max(50, Number(opts.debounce ?? 300));
        const verbose = opts.verbose ?? false;

        const targets = (opts.generate ?? "readme")
          .split(",")
          .map((t) => t.trim())
          .filter((t): t is GenerateTarget =>
            VALID_TARGETS.includes(t as GenerateTarget),
          );

        if (targets.length === 0) {
          printWarning("No valid --generate targets. Defaulting to: readme");
          targets.push("readme");
        }

        const outputs: Partial<Record<GenerateTarget, string>> = {};
        if (opts.output !== undefined && targets[0] !== undefined) {
          outputs[targets[0]] = opts.output;
        }

        blank();
        section("DocSmith — Watch mode");
        blank();
        console.log(
          formatKey("Root", formatPath(path.relative(process.cwd(), projectRoot) || ".")),
        );
        console.log(formatKey("Generators", targets.map((t) => colors.accent(t)).join(", ")));
        console.log(formatKey("Debounce", colors.muted(`${debounceMs}ms`)));
        if (opts.ignore && opts.ignore.length > 0) {
          console.log(
            formatKey("Ignore", opts.ignore.map((i) => colors.muted(i)).join(", ")),
          );
        }
        blank();

        const initSpinner = createSpinner("Scanning and running initial build…").start();
        let rebuildCount = 0;

        const pipeline = new WatchPipeline(
          projectRoot,
          {
            debounceMs,
            generate: targets,
            verbose,
            ...(opts.ignore !== undefined && opts.ignore.length > 0 && { ignore: opts.ignore }),
            ...(Object.keys(outputs).length > 0 && { outputs }),
          },
          {
            onReady(fileCount: number) {
              initSpinner.succeed(
                `Ready  ${colors.muted("·")} ${colors.accent(String(fileCount))} source files` +
                  `  ${colors.muted("·")} watching for changes…`,
              );
              blank();
              printInfo(`Press ${colors.muted("Ctrl+C")} to stop.`);
              blank();
            },

            onPhase(phase: WatchPhase, detail?: string) {
              logger.debug(`[watch] phase=${phase}${detail !== undefined ? ` ${detail}` : ""}`);
            },

            onBatchStart(batch: ChangeBatch) {
              if (batch.configChanged) {
                console.log(`  ${sym.warning}  Config changed — full rebuild queued`);
              } else if (verbose) {
                for (const fp of batch.sources) {
                  console.log(
                    `  ${sym.dot}  ${colors.dim(path.relative(projectRoot, fp))} changed`,
                  );
                }
              }
            },

            onRebuildComplete(result: RebuildResult, stats: WatchStats) {
              rebuildCount++;
              const ts  = colors.muted(new Date().toLocaleTimeString());
              const dur = colors.muted(`${result.durationMs}ms`);
              const n   = result.changedFiles.length;
              const kind = result.fullRebuild
                ? "full rebuild"
                : `${n} file${n !== 1 ? "s" : ""}`;

              console.log(
                `  ${sym.success}  Rebuilt  ` +
                  `${colors.muted(`#${rebuildCount}`)}  ` +
                  `${colors.dim(kind)}  ` +
                  `${dur}  ${ts}`,
              );

              if (verbose && result.outputCount > 0) {
                console.log(
                  `  ${sym.dot}  ${result.outputCount} output${result.outputCount !== 1 ? "s" : ""} written`,
                );
              }

              void stats; // available for future status-line display
            },

            onError(err: Error) {
              if (
                err.message.includes("ENOENT") ||
                err.message.includes("not running")
              ) {
                return; // suppress spurious watcher close noise
              }
              blank();
              printError(`Error: ${err.message}`);
              logger.debug(err.stack ?? err.message);
              blank();
            },

            onClose() {
              blank();
              divider();
              printSuccess(
                `Watch stopped after ${rebuildCount} rebuild${rebuildCount !== 1 ? "s" : ""}.`,
              );
              blank();
            },
          },
        );

        // Graceful shutdown on Ctrl+C / SIGTERM
        const shutdown = (): void => {
          pipeline.close();
          process.exit(0);
        };
        process.once("SIGINT",  shutdown);
        process.once("SIGTERM", shutdown);

        try {
          await pipeline.start();
        } catch (err) {
          initSpinner.fail("Initial build failed.");
          throw err;
        }

        if (targets.length === 1) {
          blank();
          printBox(
            [
              `More generators:  ${formatCmd("--generate readme,api,contributing")}`,
              `Custom output:    ${formatCmd("--output docs/README.md")}`,
              `Longer debounce:  ${formatCmd("--debounce 500")}`,
            ],
            "Tips",
          );
          blank();
        }

        // Block the process — SIGINT/SIGTERM handlers call pipeline.close()
        await new Promise<void>(() => undefined);
      }, logger),
    );
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}
