import type { Command } from "commander";

import { registerBuildCommand } from "./build.js";
import { registerInitCommand } from "./init.js";
import { registerServeCommand } from "./serve.js";

/**
 * Register all CLI commands onto the root Commander program.
 *
 * Adding a new command:
 *   1. Create `src/commands/<name>.ts` that exports a `register<Name>Command` fn
 *   2. Import it here and call it inside `registerAllCommands`
 *   3. That's it — the command is live.
 */
export function registerAllCommands(program: Command): void {
  registerInitCommand(program);
  registerBuildCommand(program);
  registerServeCommand(program);
}
