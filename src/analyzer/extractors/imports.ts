import ts from "typescript";

import type { ImportBinding, ImportEntry } from "../types.js";
import { isExternalSpecifier, nodeRange, walkNode } from "./utils.js";

export function extractImports(
  sf: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
): ImportEntry[] {
  const imports: ImportEntry[] = [];

  // ── Static imports ────────────────────────────────────────────────────────
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;

    const specifier = (stmt.moduleSpecifier as ts.StringLiteral).text;
    const isType = stmt.importClause?.isTypeOnly ?? false;
    const bindings: ImportBinding[] = [];

    const clause = stmt.importClause;
    if (clause !== undefined) {
      if (clause.name !== undefined) {
        bindings.push({
          local: clause.name.text,
          imported: "default",
          isType,
        });
      }
      if (clause.namedBindings !== undefined) {
        if (ts.isNamespaceImport(clause.namedBindings)) {
          bindings.push({
            local: clause.namedBindings.name.text,
            imported: "*",
            isType,
          });
        } else {
          for (const el of clause.namedBindings.elements) {
            bindings.push({
              local: el.name.text,
              imported: el.propertyName?.text ?? el.name.text,
              isType: isType || el.isTypeOnly,
            });
          }
        }
      }
    }

    const entry: ImportEntry = {
      specifier,
      kind: "static",
      isType,
      bindings,
      isExternal: isExternalSpecifier(specifier),
      location: nodeRange(stmt, sf),
    };

    resolveImport(entry, sf.fileName, compilerOptions);
    imports.push(entry);
  }

  // ── Dynamic import() and require() — walk entire file ────────────────────
  walkNode(sf, (n) => {
    if (!ts.isCallExpression(n)) return;

    // import('specifier')
    if (n.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = n.arguments[0];
      if (arg !== undefined && ts.isStringLiteral(arg)) {
        const entry: ImportEntry = {
          specifier: arg.text,
          kind: "dynamic",
          isType: false,
          bindings: [],
          isExternal: isExternalSpecifier(arg.text),
          location: nodeRange(n, sf),
        };
        resolveImport(entry, sf.fileName, compilerOptions);
        imports.push(entry);
      }
      return "stop";
    }

    // require('specifier')
    if (
      ts.isIdentifier(n.expression) &&
      n.expression.text === "require" &&
      n.arguments.length > 0
    ) {
      const arg = n.arguments[0];
      if (arg !== undefined && ts.isStringLiteral(arg)) {
        const entry: ImportEntry = {
          specifier: arg.text,
          kind: "require",
          isType: false,
          bindings: [],
          isExternal: isExternalSpecifier(arg.text),
          location: nodeRange(n, sf),
        };
        resolveImport(entry, sf.fileName, compilerOptions);
        imports.push(entry);
      }
    }
  });

  return imports;
}

function resolveImport(
  entry: ImportEntry,
  fromFile: string,
  options: ts.CompilerOptions,
): void {
  const result = ts.resolveModuleName(entry.specifier, fromFile, options, ts.sys);
  const mod = result.resolvedModule;
  if (mod !== undefined) {
    entry.resolvedPath = mod.resolvedFileName;
    entry.isExternal = mod.isExternalLibraryImport ?? false;
  }
}
