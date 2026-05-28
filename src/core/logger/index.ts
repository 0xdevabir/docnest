import {
  isLevelEnabled,
  jsonFormat,
  prettyFormat,
  type LogLevel,
} from "./formatters.js";

export type { LogLevel };

export interface LoggerOptions {
  level?: LogLevel;
  format?: "pretty" | "json";
  /** Prefix all messages with a tag, e.g. "[plugin:foo]" */
  tag?: string;
}

// ── Logger class ───────────────────────────────────────────────────────────

export class Logger {
  private readonly level: LogLevel;
  private readonly format: "pretty" | "json";
  private readonly tag: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.format = options.format ?? "pretty";
    this.tag = options.tag ?? "";
  }

  /** Create a child logger that inherits settings but adds a scoped tag. */
  child(tag: string): Logger {
    return new Logger({
      level: this.level,
      format: this.format,
      tag: this.tag ? `${this.tag}:${tag}` : tag,
    });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write("error", message, meta);
  }

  private write(
    level: Exclude<LogLevel, "silent">,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (!isLevelEnabled(this.level, level)) return;

    const taggedMessage = this.tag ? `[${this.tag}] ${message}` : message;
    const line =
      this.format === "json"
        ? jsonFormat(level, taggedMessage, meta)
        : prettyFormat(level, taggedMessage, meta);

    // Errors and warnings go to stderr; everything else to stdout
    if (level === "error" || level === "warn") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  }
}

// ── Default singleton ──────────────────────────────────────────────────────
// Commands import this directly; tests can create their own instances.

export const logger = new Logger({
  level: (process.env["DOCSMITH_LOG_LEVEL"] as LogLevel | undefined) ?? "info",
  format:
    process.env["DOCSMITH_LOG_FORMAT"] === "json" ? "json" : "pretty",
});
