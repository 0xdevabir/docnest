/**
 * DocSmith error hierarchy.
 *
 * All errors extend DocSmithError so consumers can `instanceof` catch
 * the whole family without knowing every subclass.
 */

// ── Base ───────────────────────────────────────────────────────────────────

export class DocSmithError extends Error {
  /** Machine-readable error code, usable in JSON output / CI scripts. */
  readonly code: string;
  /** HTTP-style exit code hint (1 = generic failure, 2 = misuse). */
  readonly exitCode: number;

  constructor(message: string, code = "DOCSMITH_ERROR", exitCode = 1) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    // Restore prototype chain broken by TypeScript transpilation
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ── Config ─────────────────────────────────────────────────────────────────

export class ConfigError extends DocSmithError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
  }
}

export class ConfigNotFoundError extends DocSmithError {
  constructor(searchedPaths: string[]) {
    super(
      `No configuration file found. Searched:\n  ${searchedPaths.join("\n  ")}`,
      "CONFIG_NOT_FOUND",
    );
  }
}

export class ConfigValidationError extends DocSmithError {
  readonly issues: Array<{ path: string; message: string }>;

  constructor(issues: Array<{ path: string; message: string }>) {
    const summary = issues
      .map((i) => `  • ${i.path}: ${i.message}`)
      .join("\n");
    super(`Configuration is invalid:\n${summary}`, "CONFIG_VALIDATION_ERROR");
    this.issues = issues;
  }
}

// ── Plugin ─────────────────────────────────────────────────────────────────

export class PluginError extends DocSmithError {
  readonly pluginName: string;

  constructor(pluginName: string, message: string) {
    super(`[plugin:${pluginName}] ${message}`, "PLUGIN_ERROR");
    this.pluginName = pluginName;
  }
}

export class PluginLoadError extends DocSmithError {
  readonly pluginName: string;

  constructor(pluginName: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(`[plugin:${pluginName}] Failed to load: ${reason}`, "PLUGIN_LOAD_ERROR");
    this.pluginName = pluginName;
  }
}

// ── Command ────────────────────────────────────────────────────────────────

export class CommandError extends DocSmithError {
  readonly command: string;

  constructor(command: string, message: string, exitCode = 1) {
    super(message, "COMMAND_ERROR", exitCode);
    this.command = command;
  }
}

// ── File System ────────────────────────────────────────────────────────────

export class FileSystemError extends DocSmithError {
  readonly filePath: string;

  constructor(filePath: string, message: string) {
    super(`${message}: ${filePath}`, "FS_ERROR");
    this.filePath = filePath;
  }
}
