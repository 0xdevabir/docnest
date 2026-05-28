import ts from "typescript";

import type { FunctionEntry, FunctionKind } from "../types.js";
import {
  extractParams,
  getJsdoc,
  isDefaultNode,
  isExportedNode,
  nodeRange,
} from "./utils.js";

export function extractFunctions(sf: ts.SourceFile): FunctionEntry[] {
  const functions: FunctionEntry[] = [];

  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name !== undefined) {
      functions.push(fromDeclaration(stmt, sf));
      continue;
    }

    if (ts.isVariableStatement(stmt)) {
      const isExported = isExportedNode(stmt);
      const isDefault = isDefaultNode(stmt);
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const init = decl.initializer;
        if (init === undefined) continue;
        if (ts.isFunctionExpression(init) || ts.isArrowFunction(init)) {
          functions.push(
            fromFunctionLike(
              init,
              decl.name.text,
              ts.isArrowFunction(init) ? "arrow" : "expression",
              isExported,
              isDefault,
              sf,
            ),
          );
        }
      }
    }
  }

  return functions;
}

function fromDeclaration(
  node: ts.FunctionDeclaration,
  sf: ts.SourceFile,
): FunctionEntry {
  const returnType = node.type?.getText(sf);
  const jsdoc = getJsdoc(node, sf);
  return {
    name: node.name!.text,
    kind: "declaration",
    isAsync:
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ??
      false,
    isGenerator: node.asteriskToken !== undefined,
    isExported: isExportedNode(node),
    isDefault: isDefaultNode(node),
    params: extractParams(node.parameters, sf),
    ...(returnType !== undefined && { returnType }),
    ...(jsdoc !== undefined && { jsdoc }),
    location: nodeRange(node, sf),
  };
}

function fromFunctionLike(
  node: ts.FunctionExpression | ts.ArrowFunction,
  name: string,
  kind: FunctionKind,
  isExported: boolean,
  isDefault: boolean,
  sf: ts.SourceFile,
): FunctionEntry {
  const returnType = node.type?.getText(sf);
  return {
    name,
    kind,
    isAsync:
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ??
      false,
    isGenerator: ts.isFunctionExpression(node)
      ? node.asteriskToken !== undefined
      : false,
    isExported,
    isDefault,
    params: extractParams(node.parameters, sf),
    ...(returnType !== undefined && { returnType }),
    location: nodeRange(node, sf),
  };
}
