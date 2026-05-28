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

const LEVEL_BADGE: Record<Exclude<LogLevel, "silent">, string> = {
  debug: chalk.gray("[debug]"),
  info: chalk.cyan("[info] "),
  warn: chalk.yellow("[warn] "),
  error: chalk.red("[error]"),
};

export function prettyFormat(
  level: Exclude<LogLevel, "silent">,
  message: string,
  meta?: Record<string, unknown>,
): string {
  const badge = LEVEL_BADGE[level];
  const metaPart =
    meta && Object.keys(meta).length > 0
      ? chalk.gray(" " + JSON.stringify(meta))
      : "";
  return `${badge} ${message}${metaPart}`;
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
