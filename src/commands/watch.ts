import { watch as fsWatch } from "node:fs";
import path from "node:path";

import { type Command } from "commander";

import { tryLoadConfig } from "../core/config/index.js";
import { withErrorHandling } from "../core/errors/handler.js";
import { logger } from "../core/logger/index.js";
import {
  blank,
  colors,
  createSpinner,
  formatCmd,
  formatKey,
  formatPath,
  printBox,
  printInfo,
  printSuccess,
  printWarning,
  section,
  sym,
} from "../utils/terminal.js";

interface WatchOptions {
  config?: string;
  debounce?: string;
  ignore?: string[];
}

/**
 * `docsmith watch` — watch documentation source files and rebuild on change.
 *
 * Uses Node's native `fs.watch` for file-system events. For production-grade
 * watching with glob patterns, replace with chokidar:
 *   `pnpm add chokidar`
 */
export function registerWatchCommand(program: Command): void {
  program
    .command("watch")
    .description("Watch source files and rebuild documentation on change")
    .option("-c, --config <path>", "Path to a config file")
    .option(
      "--debounce <ms>",
      "Debounce interval between rebuilds in milliseconds",
      "300",
    )
    .option(
      "--ignore <pattern>",
      "Additional glob patterns to ignore (repeatable)",
      collect,
      [] as string[],
    )
    .addHelpText(
      "after",
      `
Examples:
  ${formatCmd("docsmith watch")}
  ${formatCmd("docsmith watch --debounce 500")}
  ${formatCmd("docsmith watch --ignore 'drafts/**' --ignore 'archive/**'")}
`,
    )
    .action(
      withErrorHandling(async (opts: WatchOptions) => {
        // ── Load config ────────────────────────────────────────────────────

        const configSpinner = createSpinner("Loading configuration…").start();

        const resolved = await tryLoadConfig({
          ...(opts.config !== undefined && { configPath: opts.config }),
          cwd: process.cwd(),
        });

        if (!resolved) {
          configSpinner.fail(
            "No docsmith.config.* found. Run " +
              formatCmd("docsmith init") +
              " first.",
          );
          process.exit(1);
        }

        const { config, filepath } = resolved;
        configSpinner.succeed(
          `${colors.dim("Config")}  ${formatPath(path.relative(process.cwd(), filepath))}`,
        );

        // ── Summary ────────────────────────────────────────────────────────

        const debounceMs = Math.max(50, Number(opts.debounce ?? 300));
        const watchDir = path.resolve(process.cwd(), "docs");

        blank();
        section("Watch mode");
        blank();
        console.log(formatKey("Project", colors.highlight(config.name)));
        console.log(formatKey("Watch dir", formatPath(path.relative(process.cwd(), watchDir))));
        console.log(formatKey("Patterns", config.include.map((p) => colors.muted(p)).join(", ")));
        console.log(formatKey("Output", formatPath(config.output.dir)));
        console.log(formatKey("Debounce", colors.muted(`${debounceMs}ms`)));
        blank();

        // ── Start watcher ──────────────────────────────────────────────────

        printInfo(
          `Watching for changes… press ${colors.muted("Ctrl+C")} to stop`,
        );
        blank();

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        let rebuilding = false;
        let changeCount = 0;

        const triggerRebuild = (changedFile: string) => {
          if (debounceTimer !== null) clearTimeout(debounceTimer);

          debounceTimer = setTimeout(async () => {
            if (rebuilding) return;
            rebuilding = true;
            changeCount++;

            const rel = path.relative(process.cwd(), changedFile);
            const spinner = createSpinner(
              `Rebuilding  ${colors.muted(`(#${changeCount})`)}  ${colors.dim(rel)}…`,
            ).start();

            try {
              // Simulated rebuild — replace with real build pipeline call
              // once `buildDocs(ctx)` is extracted from commands/build.ts
              await simulateRebuild();

              spinner.succeed(
                `${sym.tick}  Rebuilt  ${colors.muted(`#${changeCount}`)}  ${colors.dim(rel)}  ${colors.muted(new Date().toLocaleTimeString())}`,
              );
            } catch (error) {
              spinner.fail(`Rebuild failed on ${colors.error(rel)}`);
              logger.debug(error instanceof Error ? error.message : String(error));
            } finally {
              rebuilding = false;
            }
          }, debounceMs);
        };

        // Attempt to watch the docs directory
        let watcher: ReturnType<typeof fsWatch> | null = null;

        try {
          watcher = fsWatch(
            watchDir,
            { recursive: true, persistent: true },
            (_event, filename) => {
              if (filename === null) return;

              const fullPath = path.join(watchDir, filename);

              // Skip files matching ignore patterns
              const ignored = [
                "node_modules",
                ".git",
                config.output.dir,
                ...(opts.ignore ?? []),
              ];
              if (ignored.some((ig) => fullPath.includes(ig))) return;

              triggerRebuild(fullPath);
            },
          );
        } catch {
          printWarning(
            `Could not watch ${formatPath(watchDir)} — directory may not exist yet.`,
          );
          blank();
          printBox(
            [
              `${sym.bullet}  Create the docs directory first:`,
              `   ${formatCmd("mkdir docs")}`,
              `   ${formatCmd('echo "# Hello" > docs/index.md')}`,
              "",
              `${sym.bullet}  Then re-run watch:`,
              `   ${formatCmd("docsmith watch")}`,
            ],
            "Directory not found",
          );
          blank();
          process.exit(1);
        }

        // Upgrade notice for production-grade watching
        printBox(
          [
            `${sym.info}  Install ${colors.code("chokidar")} for glob-based watching:`,
            `   ${formatCmd("pnpm add chokidar")}`,
            "",
            `${sym.info}  Then swap the watcher in ${formatPath("src/commands/watch.ts")}`,
          ],
          "Tip",
        );
        blank();

        // ── Graceful shutdown ──────────────────────────────────────────────

        const cleanup = () => {
          blank();
          if (debounceTimer !== null) clearTimeout(debounceTimer);
          watcher?.close();
          printSuccess(`Watch stopped. ${changeCount} rebuild(s) triggered.`);
          blank();
          process.exit(0);
        };

        process.on("SIGINT", cleanup);
        process.on("SIGTERM", cleanup);

        // Keep the process alive
        await new Promise<void>(() => undefined);
      }, logger),
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Accumulate --ignore flags into an array. */
function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

/** Placeholder until the build pipeline is extracted into a callable function. */
async function simulateRebuild(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 120));
}
