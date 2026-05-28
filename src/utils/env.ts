import { config as loadDotenv } from "dotenv";

import type { LogLevel } from "../core/logger/index.js";

/**
 * Load `.env` file into `process.env`.
 * Safe to call multiple times — dotenv skips already-set keys by default.
 */
export function loadEnv(path?: string): void {
  loadDotenv({ path: path ?? ".env", override: false });
}

// ── Typed env accessors ────────────────────────────────────────────────────

export function getEnvString(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value !== undefined) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${key}`);
}

export function getEnvBool(key: string, fallback = false): boolean {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1" || raw === "yes";
}

export function getLogLevel(fallback: LogLevel = "info"): LogLevel {
  const raw = process.env["DOCSMITH_LOG_LEVEL"];
  const valid: LogLevel[] = ["debug", "info", "warn", "error", "silent"];
  if (raw && (valid as string[]).includes(raw)) return raw as LogLevel;
  return fallback;
}

/** True when running in a CI environment. */
export function isCI(): boolean {
  return (
    getEnvBool("CI") ||
    getEnvBool("CONTINUOUS_INTEGRATION") ||
    getEnvBool("GITHUB_ACTIONS")
  );
}

/** True when running inside a test runner. */
export function isTest(): boolean {
  return process.env["NODE_ENV"] === "test" || getEnvBool("VITEST");
}
