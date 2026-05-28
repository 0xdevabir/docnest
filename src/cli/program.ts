import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { Command } from "commander";

import { registerAllCommands } from "../commands/index.js";

function getVersion(): string {
  try {
    // Works whether we're running from dist/ or directly via tsx
    const require = createRequire(import.meta.url);
    const pkgPath = require.resolve("../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

/**
 * Build and return the root Commander program.
 * Separating this from the process entry point makes the CLI testable.
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name("docsmith")
    .description(
      "DocSmith — a powerful developer documentation tool built for teams who ship.",
    )
    .version(getVersion(), "-v, --version", "Print the current version")
    // Global flags available on every subcommand
    .option("--verbose", "Enable verbose/debug output")
    .option("--no-color", "Disable colored output")
    // Commander error handling
    .showHelpAfterError(true)
    .allowExcessArguments(false);

  // Propagate --verbose to the logger before subcommand actions run
  program.hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts<{ verbose?: boolean }>();
    if (opts.verbose) {
      process.env["DOCSMITH_LOG_LEVEL"] = "debug";
    }
  });

  registerAllCommands(program);

  return program;
}
