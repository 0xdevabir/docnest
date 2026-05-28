import chalk from "chalk";
import { type Command } from "commander";
import ora from "ora";

import { tryLoadConfig } from "../core/config/index.js";
import { withErrorHandling } from "../core/errors/handler.js";
import { logger } from "../core/logger/index.js";
import { PluginRunner } from "../plugins/index.js";
import { ensureDir, removePath } from "../utils/fs.js";

interface BuildOptions {
  config?: string;
  watch?: boolean;
}

/**
 * `docsmith build` — process documentation sources and write output.
 */
export function registerBuildCommand(program: Command): void {
  program
    .command("build")
    .description("Build the documentation")
    .option("-c, --config <path>", "Path to a config file")
    .option("-w, --watch", "Rebuild on file changes")
    .action(
      withErrorHandling(async (opts: BuildOptions) => {
        const spinner = ora("Loading configuration…").start();

        const resolved = await tryLoadConfig({
          ...(opts.config !== undefined && { configPath: opts.config }),
          cwd: process.cwd(),
        });

        if (!resolved) {
          spinner.fail(
            "No docsmith.config.* found. Run " +
              chalk.cyan("docsmith init") +
              " first.",
          );
          process.exit(1);
        }

        const { config, filepath } = resolved;
        spinner.succeed(
          chalk.dim(`Loaded config: ${filepath}`),
        );

        // ── Plugin setup ───────────────────────────────────────────────────
        const runner = new PluginRunner(logger.child("plugins"));
        await runner.load(config);

        if (runner.count > 0) {
          logger.info(`${runner.count} plugin(s) loaded`);
        }

        const ctx = {
          config,
          logger: logger.child("build"),
          root: process.cwd(),
        };

        await runner.runHook("setup", ctx);

        // ── Build pipeline ─────────────────────────────────────────────────
        const buildSpinner = ora("Building…").start();

        try {
          await runner.runHook("buildStart", ctx);

          if (config.output.clean) {
            await removePath(config.output.dir);
          }
          await ensureDir(config.output.dir);

          // TODO: implement document processing pipeline
          // This is where the real build logic lives:
          //   1. Glob source files matching config.include / config.exclude
          //   2. Parse each file (markdown, MDX, etc.)
          //   3. Apply transformations from plugins
          //   4. Render to output format
          //   5. Write to config.output.dir

          await runner.runHook("buildEnd", ctx);

          buildSpinner.succeed(
            chalk.green(`Built successfully → ${config.output.dir}`),
          );
        } catch (error) {
          buildSpinner.fail("Build failed.");
          if (error instanceof Error) {
            await runner.runHook("buildError", ctx, error);
          }
          throw error;
        }

        if (opts.watch) {
          logger.info("Watching for changes… (press Ctrl+C to stop)");
          // TODO: implement watch mode using chokidar
        }
      }, logger),
    );
}
