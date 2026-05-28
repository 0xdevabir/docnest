import chalk from "chalk";
import { type Command } from "commander";

import { tryLoadConfig } from "../core/config/index.js";
import { withErrorHandling } from "../core/errors/handler.js";
import { logger } from "../core/logger/index.js";

interface ServeOptions {
  config?: string;
  port?: string;
  host?: string;
  open?: boolean;
}

/**
 * `docsmith serve` — start a local development preview server.
 *
 * NOTE: This is a placeholder. The actual HTTP server implementation
 * (e.g. using Vite or a custom express/hono server) is a future milestone.
 */
export function registerServeCommand(program: Command): void {
  program
    .command("serve")
    .description("Start a local development preview server")
    .option("-c, --config <path>", "Path to a config file")
    .option("-p, --port <port>", "Port to listen on", "3000")
    .option("--host <host>", "Host to bind to", "localhost")
    .option("--open", "Open browser automatically")
    .action(
      withErrorHandling(async (opts: ServeOptions) => {
        const resolved = await tryLoadConfig({
          ...(opts.config !== undefined && { configPath: opts.config }),
          cwd: process.cwd(),
        });

        if (!resolved) {
          logger.error(
            "No docsmith.config.* found. Run " +
              chalk.cyan("docsmith init") +
              " first.",
          );
          process.exit(1);
        }

        const port = Number(opts.port ?? 3000);
        const host = opts.host ?? "localhost";

        logger.info(
          `Dev server: ${chalk.cyan(`http://${host}:${port}`)}`,
        );
        logger.warn(
          "serve command is not yet implemented. Coming in a future release.",
        );

        // TODO: implement dev server
        // Suggested approach:
        //   1. Run a build in memory
        //   2. Start an HTTP server (hono/express) serving config.output.dir
        //   3. Use chokidar to watch config.include patterns
        //   4. On change: re-run the build, send a hot-reload signal via WS
        //   5. Inject a tiny HMR client into served HTML pages
      }, logger),
    );
}
