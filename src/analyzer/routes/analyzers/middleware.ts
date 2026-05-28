import ts from "typescript";

import type { MiddlewarePurpose, MiddlewareRef } from "../types.js";

// Maps name patterns → middleware purpose. Order matters: first match wins.
const PURPOSE_PATTERNS: ReadonlyArray<[RegExp, MiddlewarePurpose]> = [
  [/auth|guard|protect|jwt|passport|bearer|session|login|verify/i, "auth"],
  [/cors/i, "cors"],
  [/log|morgan|pino|winston/i, "logging"],
  [/rate.?limit|throttl/i, "ratelimit"],
  [/body.?parser|json\b|urlencoded|multer|formidable|busboy/i, "parsing"],
  [/compress|gzip|deflate/i, "compression"],
  [/valid|schema|zod|joi|yup/i, "validation"],
  [/error.?handler|error.?middleware|catch/i, "error"],
];

export function inferPurpose(name: string): MiddlewarePurpose {
  for (const [pattern, purpose] of PURPOSE_PATTERNS) {
    if (pattern.test(name)) return purpose;
  }
  return "unknown";
}

/**
 * Extract middleware references from a route call's argument list.
 * @param args  - Full argument list of the route call expression.
 * @param sf    - Source file for getText().
 * @param start - Index to start reading from (default: 1 to skip path arg).
 */
export function extractMiddlewareArgs(
  args: readonly ts.Expression[],
  sf: ts.SourceFile,
  start = 1,
): MiddlewareRef[] {
  const refs: MiddlewareRef[] = [];
  for (let i = start; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;
    const ref = extractMiddlewareRef(arg, sf);
    if (ref !== null) refs.push(ref);
  }
  return refs;
}

function extractMiddlewareRef(
  node: ts.Expression,
  sf: ts.SourceFile,
): MiddlewareRef | null {
  // Bare identifier reference: authenticate, isAdmin, requireAuth
  if (ts.isIdentifier(node)) {
    return { name: node.text, purpose: inferPurpose(node.text), args: [] };
  }

  // Call expression factory: cors(), rateLimit({ max: 100 }), jwt({ secret })
  if (ts.isCallExpression(node)) {
    const name = resolveCallName(node);
    if (name === null) return null;
    const callArgs = node.arguments
      .slice(0, 2)
      .map((a) => (ts.isStringLiteral(a) ? a.text : a.getText(sf)));
    return { name, purpose: inferPurpose(name), args: callArgs };
  }

  // Property access: passport.authenticate, verifier.verify
  if (ts.isPropertyAccessExpression(node)) {
    const name = ts.isIdentifier(node.expression)
      ? `${node.expression.text}.${node.name.text}`
      : node.name.text;
    return { name, purpose: inferPurpose(node.name.text), args: [] };
  }

  return null;
}

function resolveCallName(call: ts.CallExpression): string | null {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  if (
    ts.isPropertyAccessExpression(call.expression) &&
    ts.isIdentifier(call.expression.name)
  ) {
    return call.expression.name.text;
  }
  return null;
}

/**
 * Extract middleware from an array literal or a single identifier node.
 * Used for Fastify preHandler / onRequest arrays and similar patterns.
 */
export function extractArrayMiddleware(
  node: ts.Expression,
  sf: ts.SourceFile,
): MiddlewareRef[] {
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements
      .map((el) => extractMiddlewareRef(el, sf))
      .filter((r): r is MiddlewareRef => r !== null);
  }
  const single = extractMiddlewareRef(node, sf);
  return single !== null ? [single] : [];
}
