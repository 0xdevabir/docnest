import ts from "typescript";

import type { ParamEntry, SourceRange } from "../types.js";

// ── AST position helpers ──────────────────────────────────────────────────────

export function nodeRange(node: ts.Node, sf: ts.SourceFile): SourceRange {
  const s = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  const e = sf.getLineAndCharacterOfPosition(node.getEnd());
  return {
    start: { line: s.line + 1, column: s.character, offset: node.getStart(sf) },
    end: { line: e.line + 1, column: e.character, offset: node.getEnd() },
  };
}

// ── Parameter extraction ──────────────────────────────────────────────────────

export function extractParams(
  params: ts.NodeArray<ts.ParameterDeclaration>,
  sf: ts.SourceFile,
): ParamEntry[] {
  return params.map((p) => ({
    name: ts.isIdentifier(p.name) ? p.name.text : "_destructured",
    ...(p.type !== undefined && { type: p.type.getText(sf) }),
    optional: p.questionToken !== undefined || p.initializer !== undefined,
    hasDefault: p.initializer !== undefined,
    isRest: p.dotDotDotToken !== undefined,
  }));
}

// ── JSDoc extraction ──────────────────────────────────────────────────────────

export function getJsdoc(node: ts.Node, sf: ts.SourceFile): string | undefined {
  const ranges = ts.getLeadingCommentRanges(sf.text, node.getFullStart());
  if (ranges === undefined) return undefined;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const r = ranges[i];
    if (r === undefined) continue;
    if (r.kind !== ts.SyntaxKind.MultiLineCommentTrivia) continue;
    const raw = sf.text.slice(r.pos, r.end);
    if (!raw.startsWith("/**")) continue;
    const body = raw
      .slice(3, -2)
      .split("\n")
      .map((line) => line.replace(/^\s*\*\s?/, "").trimEnd())
      .join("\n")
      .trim();
    return body.length > 0 ? body : undefined;
  }
  return undefined;
}

// ── AST traversal ─────────────────────────────────────────────────────────────

/**
 * DFS walk. Return "stop" from visitor to prune that subtree.
 * Return "abort" to end the entire traversal immediately.
 */
export function walkNode(
  root: ts.Node,
  visitor: (n: ts.Node) => "stop" | "abort" | void,
): void {
  let aborted = false;

  function walk(n: ts.Node): true | undefined {
    if (aborted) return true;
    const result = visitor(n);
    if (result === "abort") {
      aborted = true;
      return true;
    }
    if (result === "stop") return undefined;
    return ts.forEachChild(n, walk);
  }

  ts.forEachChild(root, walk);
}

// ── Modifier helpers ──────────────────────────────────────────────────────────

export function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  return (ts.getModifiers(node) ?? []).some((m) => m.kind === kind);
}

export function isExportedNode(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

export function isDefaultNode(node: ts.Node): boolean {
  return hasModifier(node, ts.SyntaxKind.DefaultKeyword);
}

// ── Decorator helpers ─────────────────────────────────────────────────────────

export function getDecoratorNames(node: ts.Node): string[] {
  if (!ts.canHaveDecorators(node)) return [];
  const decorators = ts.getDecorators(node as ts.HasDecorators) ?? [];
  return decorators
    .map((d) => {
      const expr = ts.isCallExpression(d.expression)
        ? d.expression.expression
        : d.expression;
      if (ts.isIdentifier(expr)) return expr.text;
      if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression)) {
        return `${expr.expression.text}.${expr.name.text}`;
      }
      return null;
    })
    .filter((n): n is string => n !== null);
}

// ── Visibility helper ─────────────────────────────────────────────────────────

export function getVisibility(
  node: ts.Node,
): "public" | "protected" | "private" {
  if (hasModifier(node, ts.SyntaxKind.PrivateKeyword)) return "private";
  if (hasModifier(node, ts.SyntaxKind.ProtectedKeyword)) return "protected";
  return "public";
}

// ── Specifier helpers ─────────────────────────────────────────────────────────

/** True for bare specifiers that resolve to node_modules. */
export function isExternalSpecifier(specifier: string): boolean {
  return (
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !specifier.startsWith("#")
  );
}

// ── JSX detection ─────────────────────────────────────────────────────────────

/**
 * Returns true if the function-like node's body contains JSX.
 * Does not descend into nested function bodies.
 */
export function bodyHasJsx(node: ts.FunctionLikeDeclaration): boolean {
  if (node.body === undefined) return false;
  let found = false;

  function visit(n: ts.Node): true | undefined {
    if (found) return true;
    if (
      ts.isJsxElement(n) ||
      ts.isJsxSelfClosingElement(n) ||
      ts.isJsxFragment(n)
    ) {
      found = true;
      return true;
    }
    // Skip nested function bodies — they belong to inner components/callbacks
    if (
      n !== node.body &&
      (ts.isFunctionDeclaration(n) ||
        ts.isArrowFunction(n) ||
        ts.isFunctionExpression(n) ||
        ts.isMethodDeclaration(n))
    ) {
      return undefined;
    }
    return ts.forEachChild(n, visit);
  }

  ts.forEachChild(node.body, visit);
  return found;
}

/** Collect all hook calls (use* names) within a node, non-recursively into nested functions. */
export function collectHookCalls(body: ts.Node): string[] {
  const hooks = new Set<string>();

  function visit(n: ts.Node): true | undefined {
    // Skip nested function scopes
    if (
      ts.isFunctionDeclaration(n) ||
      ts.isArrowFunction(n) ||
      ts.isFunctionExpression(n)
    ) {
      return undefined;
    }
    if (
      ts.isCallExpression(n) &&
      ts.isIdentifier(n.expression) &&
      /^use[A-Z]/.test(n.expression.text)
    ) {
      hooks.add(n.expression.text);
    }
    return ts.forEachChild(n, visit);
  }

  ts.forEachChild(body, visit);
  return [...hooks];
}

/** Returns true if a function-like's return type text suggests a React element. */
export function hasReactReturnType(
  node: ts.FunctionLikeDeclaration,
  sf: ts.SourceFile,
): boolean {
  if (node.type === undefined) return false;
  const text = node.type.getText(sf);
  return /JSX\.Element|ReactElement|ReactNode|React\.ReactElement|React\.ReactNode/.test(
    text,
  );
}
