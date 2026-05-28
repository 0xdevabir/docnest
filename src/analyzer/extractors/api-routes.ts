import ts from "typescript";

import type { ApiFramework, ApiRouteEntry, HttpMethod } from "../types.js";
import { isExportedNode, nodeRange, walkNode } from "./utils.js";

const HTTP_METHODS = new Set<HttpMethod>([
  "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS",
]);
const EXPRESS_METHODS = new Set([
  "get", "post", "put", "delete", "patch", "head", "options", "all", "use",
]);

export function extractApiRoutes(
  sf: ts.SourceFile,
  filePath: string,
): ApiRouteEntry[] {
  const routes: ApiRouteEntry[] = [];
  const framework = inferFrameworkFromPath(filePath);

  if (framework === "nextjs-pages") {
    routes.push(...extractNextjsPagesRoutes(sf));
  } else if (framework === "nextjs-app") {
    routes.push(...extractNextjsAppRoutes(sf));
  }

  routes.push(...extractCallBasedRoutes(sf));
  routes.push(...extractTrpcRoutes(sf));

  return routes;
}

// ── Next.js pages/api ─────────────────────────────────────────────────────────

function extractNextjsPagesRoutes(sf: ts.SourceFile): ApiRouteEntry[] {
  const routes: ApiRouteEntry[] = [];
  for (const stmt of sf.statements) {
    if (
      ts.isFunctionDeclaration(stmt) &&
      isExportedNode(stmt) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      const handler = stmt.name?.text ?? "handler";
      routes.push({
        method: "unknown",
        handler,
        framework: "nextjs-pages",
        isExported: true,
        location: nodeRange(stmt, sf),
      });
    }
  }
  return routes;
}

// ── Next.js app/route.ts ──────────────────────────────────────────────────────

function extractNextjsAppRoutes(sf: ts.SourceFile): ApiRouteEntry[] {
  const routes: ApiRouteEntry[] = [];
  for (const stmt of sf.statements) {
    const name = getTopLevelExportName(stmt);
    if (name === null) continue;
    const upper = name.toUpperCase() as HttpMethod;
    if (!HTTP_METHODS.has(upper)) continue;
    routes.push({
      method: upper,
      handler: name,
      framework: "nextjs-app",
      isExported: true,
      location: nodeRange(stmt, sf),
    });
  }
  return routes;
}

// ── Express / Hono / Fastify call-based ───────────────────────────────────────

function extractCallBasedRoutes(sf: ts.SourceFile): ApiRouteEntry[] {
  const routes: ApiRouteEntry[] = [];

  walkNode(sf, (n) => {
    if (!ts.isCallExpression(n)) return;

    if (
      ts.isPropertyAccessExpression(n.expression) &&
      ts.isIdentifier(n.expression.name) &&
      EXPRESS_METHODS.has(n.expression.name.text)
    ) {
      const methodRaw = n.expression.name.text;
      const method: HttpMethod =
        methodRaw === "all" || methodRaw === "use"
          ? "ALL"
          : (methodRaw.toUpperCase() as HttpMethod);

      const pathArg = n.arguments[0];
      const pathVal =
        pathArg !== undefined && ts.isStringLiteral(pathArg)
          ? pathArg.text
          : undefined;

      const framework = inferFrameworkFromCallee(n.expression.expression);
      if (framework === "unknown") return;

      routes.push({
        method,
        ...(pathVal !== undefined && { path: pathVal }),
        framework,
        isExported: false,
        location: nodeRange(n, sf),
      });
    }
  });

  return routes;
}

// ── tRPC ──────────────────────────────────────────────────────────────────────

const TRPC_PROCEDURES = new Set(["query", "mutation", "subscription"]);

function extractTrpcRoutes(sf: ts.SourceFile): ApiRouteEntry[] {
  const routes: ApiRouteEntry[] = [];

  walkNode(sf, (n) => {
    if (!ts.isCallExpression(n)) return;
    if (
      ts.isPropertyAccessExpression(n.expression) &&
      TRPC_PROCEDURES.has(n.expression.name.text)
    ) {
      routes.push({
        method: "unknown",
        handler: n.expression.name.text,
        framework: "trpc",
        isExported: false,
        location: nodeRange(n, sf),
      });
    }
  });

  return routes;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferFrameworkFromPath(filePath: string): ApiFramework {
  const norm = filePath.replace(/\\/g, "/");
  if (/\/pages\/api\//.test(norm)) return "nextjs-pages";
  if (/\/app\/.*\/route\.[jt]sx?$/.test(norm)) return "nextjs-app";
  return "unknown";
}

function inferFrameworkFromCallee(callee: ts.Expression): ApiFramework {
  if (ts.isIdentifier(callee)) {
    const name = callee.text.toLowerCase();
    if (name === "app" || name === "router") return "express";
  }
  return "unknown";
}

function getTopLevelExportName(stmt: ts.Statement): string | null {
  if (ts.isFunctionDeclaration(stmt) && isExportedNode(stmt) && stmt.name !== undefined) {
    return stmt.name.text;
  }
  if (ts.isVariableStatement(stmt) && isExportedNode(stmt)) {
    const decl = stmt.declarationList.declarations[0];
    if (decl !== undefined && ts.isIdentifier(decl.name)) {
      return decl.name.text;
    }
  }
  return null;
}
