/**
 * Hono detector.
 *
 * Recognised patterns:
 *   const app = new Hono()  /  new Hono<Env>()
 *   app.get('/path', ...middleware, handler)
 *   app.use('*', cors())  — middleware-only registration (skipped as a route)
 *   app.route('/sub', subApp)  — sub-application mounting
 *   app.basePath('/api')  — group prefix (recorded on all routes in that chain)
 *
 * Validation:
 *   zValidator('json', schema)  →  ValidationInfo{lib:'zod', target:'body'}
 *   zValidator('query', schema) →  ValidationInfo{lib:'zod', target:'query'}
 *
 * Auth:
 *   app.use('*', bearerAuth({ token }))  — global bearer auth
 *   app.use('/admin/*', jwt({ secret })) — scoped JWT
 *   These show up in middleware.purpose === 'auth'.
 */
import ts from "typescript";

import { getJsdoc, nodeRange, walkNode } from "../../extractors/utils.js";
import type { ImportEntry } from "../../types.js";
import { extractMiddlewareArgs } from "../analyzers/middleware.js";
import { inferAuthFromMiddleware } from "../analyzers/auth.js";
import { extractPathParams, deriveTagsFromPath } from "../analyzers/params.js";
import type { MiddlewareRef, RouteEntry, RouteGroup, ValidationInfo } from "../types.js";

const ROUTE_METHODS = new Set([
  "get", "post", "put", "delete", "patch", "head", "options", "all",
]);

const HTTP_METHOD_MAP: Record<string, string> = {
  get: "GET", post: "POST", put: "PUT", delete: "DELETE",
  patch: "PATCH", head: "HEAD", options: "OPTIONS", all: "ALL",
};

export interface HonoDetectionResult {
  routes: RouteEntry[];
  groups: RouteGroup[];
}

export function detectHonoRoutes(
  sf: ts.SourceFile,
  imports: ImportEntry[],
): HonoDetectionResult {
  if (!importsHono(imports)) return { routes: [], groups: [] };

  const honoInstances = findHonoInstances(sf);
  const basePathMap = findBasePaths(sf, honoInstances);
  const routes: RouteEntry[] = [];

  walkNode(sf, (n) => {
    if (!ts.isCallExpression(n)) return;
    if (!ts.isPropertyAccessExpression(n.expression)) return;

    const methodName = n.expression.name.text;
    if (!ROUTE_METHODS.has(methodName)) return;

    const callee = n.expression.expression;
    const calleeName = ts.isIdentifier(callee) ? callee.text : null;

    // Only handle known Hono instance method calls
    if (calleeName !== null && !honoInstances.has(calleeName)) return;

    const pathArg = n.arguments[0];
    const path =
      pathArg !== undefined && ts.isStringLiteral(pathArg)
        ? pathArg.text
        : undefined;

    // Skip middleware-only .use() registrations that have no real handler
    if (methodName === "use") return;

    const basePath = calleeName !== null ? basePathMap.get(calleeName) : undefined;
    const fullPath =
      basePath !== undefined && path !== undefined
        ? normalisePath(basePath + path)
        : path;

    const middleware = extractHonoMiddleware(n.arguments, sf);
    const validation = extractHonoValidation(n.arguments, sf);
    const auth = inferAuthFromMiddleware(middleware);
    const description = getJsdoc(n, sf);

    routes.push({
      ...(fullPath !== undefined && { path: fullPath }),
      methods: [HTTP_METHOD_MAP[methodName] as any ?? "GET"],
      handler: resolveHonoHandler(n.arguments, sf),
      framework: "hono",
      ...(basePath !== undefined && { groupPath: basePath }),
      tags: fullPath ? deriveTagsFromPath(fullPath) : [],
      ...(description !== undefined && { description }),
      middleware,
      auth,
      validation,
      params: fullPath ? extractPathParams(fullPath) : [],
      isExported: false,
      location: nodeRange(n, sf),
    });
  });

  const groups = buildGroups(routes, basePathMap);
  return { routes, groups };
}

// ── Middleware / validation extraction ───────────────────────────────────────

/**
 * Extract middleware refs from Hono args, filtering out `zValidator` calls
 * which are handled separately as ValidationInfo.
 */
function extractHonoMiddleware(
  args: ts.NodeArray<ts.Expression>,
  sf: ts.SourceFile,
): MiddlewareRef[] {
  const filtered = Array.from(args).slice(1, -1).filter((a) => {
    if (!ts.isCallExpression(a)) return true;
    if (!ts.isIdentifier(a.expression)) return true;
    return a.expression.text !== "zValidator";
  });
  return extractMiddlewareArgs(filtered, sf, 0);
}

function extractHonoValidation(
  args: ts.NodeArray<ts.Expression>,
  sf: ts.SourceFile,
): ValidationInfo[] {
  const validations: ValidationInfo[] = [];
  const TARGET_MAP: Record<string, ValidationInfo["target"]> = {
    json: "body", form: "body",
    query: "query", param: "params", header: "headers",
  };

  for (const arg of args) {
    if (
      !ts.isCallExpression(arg) ||
      !ts.isIdentifier(arg.expression) ||
      arg.expression.text !== "zValidator"
    ) continue;

    const targetArg = arg.arguments[0];
    const schemaArg = arg.arguments[1];

    const rawTarget =
      targetArg !== undefined && ts.isStringLiteral(targetArg) ? targetArg.text : undefined;
    const target: ValidationInfo["target"] = rawTarget !== undefined
      ? (TARGET_MAP[rawTarget] ?? "unknown")
      : "unknown";

    const schemaName =
      schemaArg !== undefined && ts.isIdentifier(schemaArg) ? schemaArg.text : undefined;

    validations.push({
      lib: "zod",
      target,
      ...(schemaName !== undefined && { schemaName }),
      inline: schemaName === undefined,
    });
  }

  return validations;
}

// ── Hono instance / basePath detection ───────────────────────────────────────

function findHonoInstances(sf: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  walkNode(sf, (n) => {
    // const app = new Hono() or new Hono<Env>()
    if (
      ts.isVariableDeclaration(n) &&
      n.initializer !== undefined &&
      ts.isNewExpression(n.initializer) &&
      ts.isIdentifier(n.initializer.expression) &&
      n.initializer.expression.text === "Hono" &&
      ts.isIdentifier(n.name)
    ) {
      names.add(n.name.text);
    }
  });
  return names;
}

/**
 * Build a map of instance-name → base path by scanning
 * `const api = app.basePath('/api')` calls.
 */
function findBasePaths(
  sf: ts.SourceFile,
  instances: Set<string>,
): Map<string, string> {
  const map = new Map<string, string>();

  walkNode(sf, (n) => {
    if (
      !ts.isVariableDeclaration(n) ||
      n.initializer === undefined ||
      !ts.isCallExpression(n.initializer)
    ) return;

    const call = n.initializer;
    if (!ts.isPropertyAccessExpression(call.expression)) return;
    if (call.expression.name.text !== "basePath") return;
    if (!ts.isIdentifier(call.expression.expression)) return;
    if (!instances.has(call.expression.expression.text)) return;

    const pathArg = call.arguments[0];
    if (pathArg === undefined || !ts.isStringLiteral(pathArg)) return;
    if (!ts.isIdentifier(n.name)) return;

    map.set(n.name.text, pathArg.text);
    instances.add(n.name.text);
  });

  return map;
}

// ── Group construction ────────────────────────────────────────────────────────

function buildGroups(
  routes: RouteEntry[],
  basePathMap: Map<string, string>,
): RouteGroup[] {
  const prefixMap = new Map<string, RouteEntry[]>();

  for (const route of routes) {
    if (route.groupPath === undefined) continue;
    const existing = prefixMap.get(route.groupPath) ?? [];
    existing.push(route);
    prefixMap.set(route.groupPath, existing);
  }

  return [...prefixMap.entries()].map(([prefix, groupRoutes]) => ({
    prefix,
    middleware: [],
    routes: groupRoutes,
    nested: [],
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function importsHono(imports: ImportEntry[]): boolean {
  return imports.some(
    (i) => i.specifier === "hono" || i.specifier.startsWith("hono/"),
  );
}

function resolveHonoHandler(
  args: ts.NodeArray<ts.Expression>,
  sf: ts.SourceFile,
): string {
  const last = args[args.length - 1];
  if (last === undefined) return "handler";
  if (ts.isIdentifier(last)) return last.text;
  if (ts.isArrowFunction(last) || ts.isFunctionExpression(last)) return "(inline)";
  return last.getText(sf).slice(0, 40);
}

function normalisePath(p: string): string {
  return p.replace(/\/{2,}/g, "/");
}
