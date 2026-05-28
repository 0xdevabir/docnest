import type { Logger } from "../logger/index.js";

import { DocSmithError } from "./index.js";

/**
 * Top-level error handler for the CLI process.
 * Formats the error for the terminal and exits with the appropriate code.
 */
export function handleFatalError(error: unknown, logger: Logger): never {
  if (error instanceof DocSmithError) {
    logger.error(error.message, { code: error.code });

    if (process.env["DOCSMITH_LOG_LEVEL"] === "debug" && error.stack) {
      logger.debug(error.stack);
    }

    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    logger.error(`Unexpected error: ${error.message}`);

    if (process.env["DOCSMITH_LOG_LEVEL"] === "debug" && error.stack) {
      logger.debug(error.stack);
    }

    process.exit(1);
  }

  logger.error(`An unknown error occurred: ${String(error)}`);
  process.exit(1);
}

/**
 * Wraps an async function and pipes any uncaught rejection through the
 * fatal error handler. Use this at the CLI action level.
 */
export function withErrorHandling<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
  logger: Logger,
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (error) {
      handleFatalError(error, logger);
    }
  };
}
