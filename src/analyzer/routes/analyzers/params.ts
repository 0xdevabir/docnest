import type { RouteParam } from "../types.js";

/**
 * Extract path parameters from a URL pattern string.
 *
 * Supports:
 * - Express/Hono/Fastify:  :id, :userId, :id?
 * - Next.js App Router:    [id], [slug], [...slug]
 * - Wildcard:              * (not extracted as a named param)
 */
export function extractPathParams(pattern: string): RouteParam[] {
  const params: RouteParam[] = [];
  const seen = new Set<string>();

  // Express/Fastify/Hono colon params: :id, :userId, :id?
  for (const m of pattern.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)(\?)?/g)) {
    const name = m[1];
    if (name === undefined || seen.has(name)) continue;
    seen.add(name);
    params.push({ name, in: "path", required: m[2] === undefined });
  }

  // Next.js bracket params: [id], [slug], [...slug]
  for (const m of pattern.matchAll(/\[(?:\.\.\.)?([^\]]+)\]/g)) {
    const name = m[1];
    if (name === undefined || seen.has(name)) continue;
    seen.add(name);
    // [...slug] is a catch-all — treat as optional
    const isCatchAll = m[0]?.includes("...");
    params.push({ name, in: "path", required: !isCatchAll });
  }

  return params;
}

/**
 * Convert a Next.js App Router file path to a URL pattern.
 * e.g. /app/users/[id]/posts/route.ts → /users/:id/posts
 */
export function filePathToRoutePath(filePath: string): string {
  const norm = filePath.replace(/\\/g, "/");
  const match = /\/app(\/.*?)\/route\.[jt]sx?$/.exec(norm);
  if (match === null || match[1] === undefined) return "/";
  return match[1]
    .replace(/\/\([^)]+\)/g, "")           // strip (group) segments
    .replace(/\[\.\.\.([^\]]+)\]/g, ":$1*") // [...slug] → :slug*
    .replace(/\[([^\]]+)\]/g, ":$1")        // [id] → :id
    || "/";
}

/**
 * Derive documentation tags from a URL pattern (first 1-2 non-param segments).
 */
export function deriveTagsFromPath(path: string): string[] {
  return path
    .split("/")
    .filter((s) => s.length > 0 && !s.startsWith(":") && s !== "*")
    .slice(0, 2);
}
