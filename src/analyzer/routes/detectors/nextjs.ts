/**
 * Next.js detector — handles both flavours:
 *
 * Pages Router  (/pages/api/...)
 *   export default function handler(req, res) {}
 *   Exports one handler for ALL methods; method dispatch is runtime-only.
 *
 * App Router  (/app/.../route.ts)
 *   export async function GET(req) {}
 *   Each exported HTTP-named function is a distinct route handler.
 *
 * Auth in Next.js typically lives in middleware.ts (outside per-file analysis)
 * so auth.protected defaults to false; call-site middleware should be detected
 * at the project level via the architecture engine.
 */
import ts from "typescript";

import { getJsdoc, isExportedNode, nodeRange } from "../../extractors/utils.js";
import type { ApiFramework, HttpMethod } from "../../types.js";
import { noAuth } from "../analyzers/auth.js";
import { extractPathParams, deriveTagsFromPath, filePathToRoutePath } from "../analyzers/params.js";
import { extractValidation } from "../analyzers/validation.js";
import type { RouteEntry } from "../types.js";

const HTTP_METHOD_SET = new Set<string>([
  "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS",
]);

// All HTTP methods — used for pages-router handlers that accept any method.
const ALL_HTTP_METHODS: HttpMethod[] = [
  "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS",
];

export function detectNextjsRoutes(
  sf: ts.SourceFile,
  filePath: string,
): RouteEntry[] {
  const framework = classifyNextjsFile(filePath);
  if (framework === "unknown") return [];

  return framework === "nextjs-pages"
    ? detectPagesRoutes(sf)
    : detectAppRoutes(sf, filePath);
}

// ── Pages Router ────────────────────────────────────────────────────────────

function detectPagesRoutes(sf: ts.SourceFile): RouteEntry[] {
  const routes: RouteEntry[] = [];

  for (const stmt of sf.statements) {
    if (
      ts.isFunctionDeclaration(stmt) &&
      isExportedNode(stmt) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      const handler = stmt.name?.text ?? "handler";
      const description = getJsdoc(stmt, sf);
      const validation = stmt.body ? extractValidation(sf, stmt.body) : [];

      routes.push({
        methods: ALL_HTTP_METHODS,
        handler,
        framework: "nextjs-pages",
        tags: [],
        ...(description !== undefined && { description }),
        middleware: [],
        auth: noAuth(),
        validation,
        params: [],
        isExported: true,
        location: nodeRange(stmt, sf),
      });
    }
  }

  return routes;
}

// ── App Router ───────────────────────────────────────────────────────────────

function detectAppRoutes(sf: ts.SourceFile, filePath: string): RouteEntry[] {
  const routes: RouteEntry[] = [];
  const routePath = filePathToRoutePath(filePath);
  const pathParams = extractPathParams(routePath);
  const tags = deriveTagsFromPath(routePath);

  for (const stmt of sf.statements) {
    const name = getTopLevelExportName(stmt);
    if (name === null) continue;
    if (!HTTP_METHOD_SET.has(name.toUpperCase())) continue;

    const method = name.toUpperCase() as HttpMethod;
    const body = getFunctionBody(stmt);
    const description = getJsdoc(stmt, sf);
    const validation = body ? extractValidation(sf, body) : [];

    routes.push({
      path: routePath,
      methods: [method],
      handler: name,
      framework: "nextjs-app",
      tags,
      ...(description !== undefined && { description }),
      middleware: [],
      auth: noAuth(),
      validation,
      params: pathParams,
      isExported: true,
      location: nodeRange(stmt, sf),
    });
  }

  return routes;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyNextjsFile(filePath: string): ApiFramework {
  const norm = filePath.replace(/\\/g, "/");
  if (/\/pages\/api\//.test(norm)) return "nextjs-pages";
  if (/\/app\/.*\/route\.[jt]sx?$/.test(norm)) return "nextjs-app";
  return "unknown";
}

function getTopLevelExportName(stmt: ts.Statement): string | null {
  if (ts.isFunctionDeclaration(stmt) && isExportedNode(stmt) && stmt.name !== undefined) {
    return stmt.name.text;
  }
  if (ts.isVariableStatement(stmt) && isExportedNode(stmt)) {
    const decl = stmt.declarationList.declarations[0];
    if (decl !== undefined && ts.isIdentifier(decl.name)) return decl.name.text;
  }
  return null;
}

function getFunctionBody(stmt: ts.Statement): ts.Block | undefined {
  if (ts.isFunctionDeclaration(stmt)) return stmt.body;
  if (ts.isVariableStatement(stmt)) {
    const decl = stmt.declarationList.declarations[0];
    if (decl?.initializer !== undefined) {
      if (ts.isArrowFunction(decl.initializer)) {
        return ts.isBlock(decl.initializer.body) ? decl.initializer.body : undefined;
      }
      if (ts.isFunctionExpression(decl.initializer)) return decl.initializer.body;
    }
  }
  return undefined;
}
