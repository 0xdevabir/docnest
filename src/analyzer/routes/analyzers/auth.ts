import type { AuthInfo, AuthStrategy, MiddlewareRef } from "../types.js";

// Maps name patterns → auth strategy. First match wins.
const STRATEGY_PATTERNS: ReadonlyArray<[RegExp, AuthStrategy]> = [
  [/jwt|bearer|token/i, "jwt"],
  [/session|cookie/i, "session"],
  [/api.?key|apiKey|x-api-key/i, "apikey"],
  [/oauth|google|github|facebook|discord|twitter/i, "oauth"],
  [/basic.?auth|http.?auth/i, "basic"],
];

export function noAuth(): AuthInfo {
  return { protected: false, strategy: "none", roles: [], scopes: [] };
}

/**
 * Infer auth metadata from a resolved middleware chain.
 * Returns `noAuth()` when no auth-purpose middleware is present.
 */
export function inferAuthFromMiddleware(middleware: MiddlewareRef[]): AuthInfo {
  const authMw = middleware.filter((m) => m.purpose === "auth");
  if (authMw.length === 0) return noAuth();

  let strategy: AuthStrategy = "custom";
  outer: for (const m of authMw) {
    for (const [pattern, s] of STRATEGY_PATTERNS) {
      if (pattern.test(m.name)) {
        strategy = s;
        break outer;
      }
    }
  }

  // Role strings look like ADMIN, SUPER_USER (all-caps with underscores)
  const roles = authMw
    .flatMap((m) => m.args)
    .filter((a) => /^[A-Z][A-Z0-9_]*$/.test(a));

  // Scope strings contain ":" or "." separators: "read:users", "users.write"
  const scopes = authMw
    .flatMap((m) => m.args)
    .filter((a) => a.includes(":") || (a.includes(".") && /^[a-z]/.test(a)));

  return { protected: true, strategy, roles, scopes };
}
