/**
 * Fastify detector.
 *
 * Recognised patterns:
 *
 * Shorthand routes:
 *   fastify.get('/path', handler)
 *   fastify.post('/path', opts, handler)
 *
 * Route object:
 *   fastify.route({ method, url, schema, handler, preHandler })
 *
 * Plugin / group mounting:
 *   fastify.register(plugin, { prefix: '/api' })
 *   → recorded as a RouteGroup with the declared prefix
 *
 * Validation via JSON Schema (Fastify native):
 *   schema: { body: {...}, querystring: {...}, params: {...}, response: {...} }
 *
 * Auth via hooks:
 *   preHandler: [fastify.authenticate]
 *   onRequest: [verifyJWT]
 */
import ts from "typescript";

import { getJsdoc, nodeRange, walkNode } from "../../extractors/utils.js";
import type { ImportEntry } from "../../types.js";
import { extractArrayMiddleware, inferPurpose } from "../analyzers/middleware.js";
import { inferAuthFromMiddleware } from "../analyzers/auth.js";
import { extractPathParams, deriveTagsFromPath } from "../analyzers/params.js";
import type {
  AuthInfo,
  MiddlewareRef,
  RouteEntry,
  RouteGroup,
  ValidationInfo,
} from "../types.js";

const SHORTHAND_METHODS = new Set([
  "get", "post", "put", "delete", "patch", "head", "options", "all",
]);

const HTTP_METHOD_MAP: Record<string, string> = {
  get: "GET", post: "POST", put: "PUT", delete: "DELETE",
  patch: "PATCH", head: "HEAD", options: "OPTIONS", all: "ALL",
};

// Fastify schema keys → ValidationInfo target
const SCHEMA_TARGET_MAP: Record<string, ValidationInfo["target"]> = {
  body: "body",
  querystring: "query",
  query: "query",
  params: "params",
  headers: "headers",
  response: "response",
};

export interface FastifyDetectionResult {
  routes: RouteEntry[];
  groups: RouteGroup[];
}

export function detectFastifyRoutes(
  sf: ts.SourceFile,
  imports: ImportEntry[],
): FastifyDetectionResult {
  if (!importsFastify(imports)) return { routes: [], groups: [] };

  const routes: RouteEntry[] = [];
  const groups: RouteGroup[] = [];

  walkNode(sf, (n) => {
    if (!ts.isCallExpression(n)) return;
    if (!ts.isPropertyAccessExpression(n.expression)) return;

    const methodName = n.expression.name.text;

    if (methodName === "route") {
      const entry = extractRouteObject(n, sf);
      if (entry !== null) routes.push(entry);
      return;
    }

    if (methodName === "register") {
      const group = extractRegisterGroup(n, sf);
      if (group !== null) groups.push(group);
      return;
    }

    if (!SHORTHAND_METHODS.has(methodName)) return;

    const entry = extractShorthandRoute(n, sf, methodName);
    if (entry !== null) routes.push(entry);
  });

  return { routes, groups };
}

// ── Shorthand: fastify.get(path, opts?, handler) ─────────────────────────────

function extractShorthandRoute(
  call: ts.CallExpression,
  sf: ts.SourceFile,
  methodName: string,
): RouteEntry | null {
  const pathArg = call.arguments[0];
  const path =
    pathArg !== undefined && ts.isStringLiteral(pathArg) ? pathArg.text : undefined;

  // Determine if opts object is present (3-arg form)
  const hasOpts = call.arguments.length >= 3;
  const optsArg = hasOpts ? call.arguments[1] : undefined;

  const { middleware, auth, validation } = optsArg !== undefined
    ? extractOpts(optsArg, sf)
    : { middleware: [], auth: inferAuthFromMiddleware([]), validation: [] };

  const description = getJsdoc(call, sf);
  return {
    ...(path !== undefined && { path }),
    methods: [HTTP_METHOD_MAP[methodName] as any ?? "GET"],
    handler: resolveFastifyHandler(call.arguments, sf),
    framework: "fastify",
    tags: path ? deriveTagsFromPath(path) : [],
    ...(description !== undefined && { description }),
    middleware,
    auth,
    validation,
    params: path ? extractPathParams(path) : [],
    isExported: false,
    location: nodeRange(call, sf),
  };
}

// ── Route object: fastify.route({ method, url, schema, handler, preHandler }) ─

function extractRouteObject(
  call: ts.CallExpression,
  sf: ts.SourceFile,
): RouteEntry | null {
  const optsArg = call.arguments[0];
  if (optsArg === undefined || !ts.isObjectLiteralExpression(optsArg)) return null;

  let method = "GET";
  let path: string | undefined;
  let handlerName = "(inline)";
  const middleware: MiddlewareRef[] = [];
  const validation: ValidationInfo[] = [];

  for (const prop of optsArg.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    const key = prop.name.text;
    const val = prop.initializer;

    switch (key) {
      case "method":
        if (ts.isStringLiteral(val)) method = val.text.toUpperCase();
        break;
      case "url":
      case "path":
        if (ts.isStringLiteral(val)) path = val.text;
        break;
      case "handler":
        handlerName = ts.isIdentifier(val) ? val.text : "(inline)";
        break;
      case "schema":
        validation.push(...extractFastifySchema(val, sf));
        break;
      case "preHandler":
      case "onRequest":
        middleware.push(...extractArrayMiddleware(val, sf));
        break;
    }
  }

  const auth = inferAuthFromMiddleware(middleware);

  return {
    ...(path !== undefined && { path }),
    methods: [method as any],
    handler: handlerName,
    framework: "fastify",
    tags: path ? deriveTagsFromPath(path) : [],
    middleware,
    auth,
    validation,
    params: path ? extractPathParams(path) : [],
    isExported: false,
    location: nodeRange(call, sf),
  };
}

// ── Plugin registration: fastify.register(plugin, { prefix }) ────────────────

function extractRegisterGroup(
  call: ts.CallExpression,
  sf: ts.SourceFile,
): RouteGroup | null {
  const optsArg = call.arguments[1];
  if (optsArg === undefined || !ts.isObjectLiteralExpression(optsArg)) return null;

  for (const prop of optsArg.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    if (!ts.isIdentifier(prop.name) || prop.name.text !== "prefix") continue;
    if (!ts.isStringLiteral(prop.initializer)) continue;

    return {
      prefix: prop.initializer.text,
      middleware: [],
      routes: [],
      nested: [],
    };
  }

  return null;
}

// ── Opts object extraction ────────────────────────────────────────────────────

function extractOpts(
  optsNode: ts.Expression,
  sf: ts.SourceFile,
): { middleware: MiddlewareRef[]; auth: AuthInfo; validation: ValidationInfo[] } {
  const middleware: MiddlewareRef[] = [];
  const validation: ValidationInfo[] = [];

  if (!ts.isObjectLiteralExpression(optsNode)) {
    return { middleware, auth: inferAuthFromMiddleware([]), validation };
  }

  for (const prop of optsNode.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    const key = prop.name.text;

    if (key === "preHandler" || key === "onRequest") {
      middleware.push(...extractArrayMiddleware(prop.initializer, sf));
    } else if (key === "schema") {
      validation.push(...extractFastifySchema(prop.initializer, sf));
    }
  }

  return { middleware, auth: inferAuthFromMiddleware(middleware), validation };
}

// ── JSON Schema extraction ────────────────────────────────────────────────────

function extractFastifySchema(
  schemaNode: ts.Expression,
  sf: ts.SourceFile,
): ValidationInfo[] {
  if (!ts.isObjectLiteralExpression(schemaNode)) return [];

  const result: ValidationInfo[] = [];
  for (const prop of schemaNode.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    const target = SCHEMA_TARGET_MAP[prop.name.text];
    if (target !== undefined) {
      result.push({ lib: "custom", target, inline: true });
    }
  }
  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function importsFastify(imports: ImportEntry[]): boolean {
  return imports.some(
    (i) =>
      i.specifier === "fastify" ||
      i.specifier === "@fastify/core" ||
      i.specifier === "fastify/types/instance",
  );
}

function resolveFastifyHandler(
  args: ts.NodeArray<ts.Expression>,
  sf: ts.SourceFile,
): string {
  const last = args[args.length - 1];
  if (last === undefined) return "handler";
  if (ts.isIdentifier(last)) return last.text;
  if (ts.isArrowFunction(last) || ts.isFunctionExpression(last)) return "(inline)";
  return last.getText(sf).slice(0, 40);
}
