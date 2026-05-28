import chalk from "chalk";

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export function isLevelEnabled(current: LogLevel, target: LogLevel): boolean {
  return LEVEL_ORDER[current] <= LEVEL_ORDER[target];
}

// ── Pretty formatter (development / human output) ─────────────────────────
//
// Badge layout:  <icon>  <message>  [meta]
//   ·  debug message          (gray dot     — low-signal noise)
//   ℹ  info message           (cyan ℹ       — normal output)
//   ⚠  warning message        (amber ⚠      — attention needed)
//   ✘  error message          (red ✘        — something failed)

const LEVEL_ICON: Record<Exclude<LogLevel, "silent">, string> = {
  debug: chalk.hex("#6B7280")(" · "),
  info:  chalk.hex("#06B6D4")(" ℹ "),
  warn:  chalk.hex("#F59E0B")(" ⚠ "),
  error: chalk.hex("#EF4444")(" ✘ "),
};

const LEVEL_MSG_COLOR: Record<Exclude<LogLevel, "silent">, (s: string) => string> = {
  debug: chalk.hex("#9CA3AF"),
  info:  chalk.white,
  warn:  chalk.hex("#FCD34D"),
  error: chalk.hex("#FCA5A5"),
};

export function prettyFormat(
  level: Exclude<LogLevel, "silent">,
  message: string,
  meta?: Record<string, unknown>,
): string {
  const icon = LEVEL_ICON[level];
  const colorMsg = LEVEL_MSG_COLOR[level];
  const metaPart =
    meta !== undefined && Object.keys(meta).length > 0
      ? chalk.hex("#6B7280")("  " + JSON.stringify(meta))
      : "";
  return `${icon}${colorMsg(message)}${metaPart}`;
}

// ── JSON formatter (CI / machine-readable output) ─────────────────────────

export function jsonFormat(
  level: Exclude<LogLevel, "silent">,
  message: string,
  meta?: Record<string, unknown>,
): string {
  return JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
}
