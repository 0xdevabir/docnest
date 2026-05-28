/**
 * Express detector — covers Express and any library that follows the same
 * calling convention: app.METHOD(path, ...middleware, handler).
 *
 * Recognised patterns:
 *   app.get('/users', authenticate, getUsers)
 *   router.post('/users', validate(schema), createUser)
 *   router.route('/users').get(handler).post(handler)  (chained routes)
 *   app.use('/prefix', subRouter)                      (group mounting)
 *
 * Group mounting is recorded in RouteGroup; individual routes that cannot
 * be statically resolved to a mounted router get groupPath = undefined.
 */
import ts from "typescript";

import { getJsdoc, nodeRange, walkNode } from "../../extractors/utils.js";
import type { ImportEntry } from "../../types.js";
import { extractArrayMiddleware, extractMiddlewareArgs } from "../analyzers/middleware.js";
import { inferAuthFromMiddleware } from "../analyzers/auth.js";
import { extractValidation } from "../analyzers/validation.js";
import { extractPathParams, deriveTagsFromPath } from "../analyzers/params.js";
import type { MiddlewareRef, RouteEntry, RouteGroup, RouteParam } from "../types.js";

const ROUTE_METHODS = new Set([
  "get", "post", "put", "delete", "patch", "head", "options", "all",
]);

const HTTP_METHOD_MAP: Record<string, string> = {
  get: "GET", post: "POST", put: "PUT", delete: "DELETE",
  patch: "PATCH", head: "HEAD", options: "OPTIONS", all: "ALL",
};

export interface ExpressDetectionResult {
  routes: RouteEntry[];
  groups: RouteGroup[];
}

export function detectExpressRoutes(
  sf: ts.SourceFile,
  imports: ImportEntry[],
): ExpressDetectionResult {
  if (!importsExpress(imports)) return { routes: [], groups: [] };

  const routes: RouteEntry[] = [];
  const mountMap = buildMountMap(sf);

  walkNode(sf, (n) => {
    if (!ts.isCallExpression(n)) return;
    if (!ts.isPropertyAccessExpression(n.expression)) return;

    const methodName = n.expression.name.text;
    if (!ROUTE_METHODS.has(methodName)) return;

    const callee = n.expression.expression;

    // Reject deeply nested property chains that are unlikely to be routers
    if (
      !ts.isIdentifier(callee) &&
      !(ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression))
    ) return;

    const pathArg = n.arguments[0];
    const path =
      pathArg !== undefined && ts.isStringLiteral(pathArg)
        ? pathArg.text
        : undefined;

    const calleeName = ts.isIdentifier(callee) ? callee.text : undefined;
    const groupPath = calleeName !== undefined ? mountMap.get(calleeName) : undefined;

    const middleware = extractMiddlewareArgs(Array.from(n.arguments), sf, 1);
    const auth = inferAuthFromMiddleware(middleware);
    const validation = extractValidation(sf, n);
    const description = getJsdoc(n, sf);
    const params: RouteParam[] = path ? extractPathParams(path) : [];

    routes.push({
      ...(path !== undefined && { path }),
      methods: [HTTP_METHOD_MAP[methodName] as any ?? "GET"],
      handler: resolveHandlerName(n.arguments, sf),
      framework: "express",
      ...(groupPath !== undefined && { groupPath }),
      tags: path ? deriveTagsFromPath(path) : [],
      ...(description !== undefined && { description }),
      middleware,
      auth,
      validation,
      params,
      isExported: false,
      location: nodeRange(n, sf),
    });
  });

  const groups = buildGroups(routes, mountMap);
  return { routes, groups };
}

// ── Group detection ──────────────────────────────────────────────────────────

/**
 * Build a map of router-variable-name → mount prefix by scanning
 * `app.use('/prefix', routerVar)` calls.
 */
function buildMountMap(sf: ts.SourceFile): Map<string, string> {
  const map = new Map<string, string>();

  walkNode(sf, (n) => {
    if (!ts.isCallExpression(n)) return;
    if (!ts.isPropertyAccessExpression(n.expression)) return;
    if (n.expression.name.text !== "use") return;

    const pathArg = n.arguments[0];
    const routerArg = n.arguments[1];
    if (
      pathArg === undefined || routerArg === undefined ||
      !ts.isStringLiteral(pathArg) || !ts.isIdentifier(routerArg)
    ) return;

    map.set(routerArg.text, pathArg.text);
  });

  return map;
}

function buildGroups(
  routes: RouteEntry[],
  mountMap: Map<string, string>,
): RouteGroup[] {
  const prefixMap = new Map<string, RouteEntry[]>();

  for (const route of routes) {
    if (route.groupPath === undefined) continue;
    const existing = prefixMap.get(route.groupPath) ?? [];
    existing.push(route);
    prefixMap.set(route.groupPath, existing);
  }

  const groups: RouteGroup[] = [];
  for (const [prefix, groupRoutes] of prefixMap) {
    groups.push({ prefix, middleware: [], routes: groupRoutes, nested: [] });
  }
  return groups;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function importsExpress(imports: ImportEntry[]): boolean {
  return imports.some((i) => i.specifier === "express" || i.specifier === "express-router");
}

/** Last argument to the route call is typically the handler. */
function resolveHandlerName(
  args: ts.NodeArray<ts.Expression>,
  sf: ts.SourceFile,
): string {
  const last = args[args.length - 1];
  if (last === undefined) return "handler";
  if (ts.isIdentifier(last)) return last.text;
  if (ts.isArrowFunction(last) || ts.isFunctionExpression(last)) return "(inline)";
  if (ts.isPropertyAccessExpression(last) && ts.isIdentifier(last.name)) {
    return last.name.text;
  }
  return last.getText(sf).slice(0, 40);
}

export { extractPathParams as extractExpressPathParams };
