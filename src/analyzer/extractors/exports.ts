import ts from "typescript";

import type { ExportEntry } from "../types.js";
import { isExternalSpecifier, nodeRange, walkNode } from "./utils.js";

export function extractExports(sf: ts.SourceFile): ExportEntry[] {
  const exports: ExportEntry[] = [];

  for (const stmt of sf.statements) {
    // export { foo, bar } | export { foo } from './mod' | export * from './mod'
    if (ts.isExportDeclaration(stmt)) {
      const source = stmt.moduleSpecifier
        ? (stmt.moduleSpecifier as ts.StringLiteral).text
        : undefined;
      const isType = stmt.isTypeOnly;

      if (stmt.exportClause === undefined) {
        // export * from './mod'
        if (source !== undefined) {
          exports.push({
            name: "*",
            kind: "re-export-all",
            isType,
            source,
            location: nodeRange(stmt, sf),
          });
        }
      } else if (ts.isNamespaceExport(stmt.exportClause)) {
        // export * as ns from './mod'
        exports.push({
          name: stmt.exportClause.name.text,
          kind: "namespace",
          isType,
          ...(source !== undefined && { source }),
          location: nodeRange(stmt, sf),
        });
      } else {
        // export { foo, type Bar } | export { foo } from './mod'
        for (const el of stmt.exportClause.elements) {
          exports.push({
            name: el.name.text,
            kind: source !== undefined ? "re-export-named" : "named",
            isType: isType || el.isTypeOnly,
            ...(source !== undefined && { source }),
            location: nodeRange(el, sf),
          });
        }
      }
      continue;
    }

    // export default expr
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals) {
      exports.push({
        name: "default",
        kind: "default",
        isType: false,
        location: nodeRange(stmt, sf),
      });
      continue;
    }

    // export const/let/var ...
    if (
      ts.isVariableStatement(stmt) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const isDefault =
        stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) ??
        false;
      for (const decl of stmt.declarationList.declarations) {
        const name = ts.isIdentifier(decl.name) ? decl.name.text : "_";
        exports.push({
          name,
          kind: isDefault ? "default" : "named",
          isType: false,
          location: nodeRange(decl, sf),
        });
      }
      continue;
    }

    // export function | export class | export interface | export type | export enum
    if (
      (ts.isFunctionDeclaration(stmt) ||
        ts.isClassDeclaration(stmt) ||
        ts.isInterfaceDeclaration(stmt) ||
        ts.isTypeAliasDeclaration(stmt) ||
        ts.isEnumDeclaration(stmt)) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const isDefault =
        stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) ??
        false;
      const isTypeExport =
        ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt);
      const name =
        !isDefault && "name" in stmt && stmt.name !== undefined
          ? (stmt.name as ts.Identifier).text
          : "default";

      exports.push({
        name,
        kind: isDefault ? "default" : "named",
        isType: isTypeExport,
        location: nodeRange(stmt, sf),
      });
    }
  }

  // module.exports = {} (CJS compat)
  walkNode(sf, (n) => {
    if (!ts.isExpressionStatement(n)) return;
    const expr = n.expression;
    if (
      ts.isBinaryExpression(expr) &&
      expr.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(expr.left) &&
      ts.isIdentifier(expr.left.expression) &&
      expr.left.expression.text === "module" &&
      expr.left.name.text === "exports"
    ) {
      exports.push({
        name: "default",
        kind: "default",
        isType: false,
        location: nodeRange(n, sf),
      });
      return "stop";
    }
  });

  return exports;
}

export function resolveExportSources(
  exports: ExportEntry[],
  fromFile: string,
  options: ts.CompilerOptions,
): void {
  for (const exp of exports) {
    if (exp.source === undefined || isExternalSpecifier(exp.source)) continue;
    const result = ts.resolveModuleName(exp.source, fromFile, options, ts.sys);
    const mod = result.resolvedModule;
    if (mod !== undefined) {
      exp.resolvedSource = mod.resolvedFileName;
    }
  }
}
