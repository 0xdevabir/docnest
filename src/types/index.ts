/**
 * Global type definitions shared across the entire DocSmith codebase.
 * Keep this file lean — domain-specific types live in their own modules.
 */

// ── Utility Types ──────────────────────────────────────────────────────────

/** Makes specific keys of T required, leaving others unchanged. */
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/** Deep partial — every nested property becomes optional. */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** A plain key-value record. */
export type Dict<V = unknown> = Record<string, V>;

/** Marks a value as explicitly unset vs. `undefined`. */
export type Maybe<T> = T | null | undefined;

// ── Result Type ────────────────────────────────────────────────────────────

/** A discriminated union for operations that can fail without throwing. */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ── CLI Context ────────────────────────────────────────────────────────────

/** Passed through every command as shared runtime context. */
export interface CliContext {
  /** Absolute path to the nearest docsmith.config.* file. */
  configPath: string | null;
  /** Current working directory at invocation time. */
  cwd: string;
  /** Whether verbose/debug output is enabled. */
  verbose: boolean;
}

// ── Semantic Versioning ────────────────────────────────────────────────────

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}
