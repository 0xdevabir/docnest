import ts from "typescript";

import type { HookEntry } from "../types.js";
import {
  collectHookCalls,
  extractParams,
  getJsdoc,
  isDefaultNode,
  isExportedNode,
  nodeRange,
} from "./utils.js";

const HOOK_NAME = /^use[A-Z]/;

export function extractHooks(sf: ts.SourceFile): HookEntry[] {
  const hooks: HookEntry[] = [];

  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name !== undefined) {
      if (HOOK_NAME.test(stmt.name.text)) {
        hooks.push(fromDeclaration(stmt, sf));
      }
      continue;
    }

    if (ts.isVariableStatement(stmt)) {
      const isExported = isExportedNode(stmt);
      const isDefault = isDefaultNode(stmt);
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        if (!HOOK_NAME.test(decl.name.text)) continue;
        const init = decl.initializer;
        if (init === undefined) continue;
        if (ts.isFunctionExpression(init) || ts.isArrowFunction(init)) {
          hooks.push(fromLike(init, decl.name.text, isExported, isDefault, sf));
        }
      }
    }
  }

  return hooks;
}

function fromDeclaration(
  node: ts.FunctionDeclaration,
  sf: ts.SourceFile,
): HookEntry {
  const returnType = node.type?.getText(sf);
  const jsdoc = getJsdoc(node, sf);
  return {
    name: node.name!.text,
    isExported: isExportedNode(node),
    isDefault: isDefaultNode(node),
    params: extractParams(node.parameters, sf),
    ...(returnType !== undefined && { returnType }),
    hooksUsed: node.body !== undefined ? collectHookCalls(node.body) : [],
    ...(jsdoc !== undefined && { jsdoc }),
    location: nodeRange(node, sf),
  };
}

function fromLike(
  node: ts.FunctionExpression | ts.ArrowFunction,
  name: string,
  isExported: boolean,
  isDefault: boolean,
  sf: ts.SourceFile,
): HookEntry {
  const returnType = node.type?.getText(sf);
  return {
    name,
    isExported,
    isDefault,
    params: extractParams(node.parameters, sf),
    ...(returnType !== undefined && { returnType }),
    hooksUsed:
      node.body !== undefined && ts.isBlock(node.body)
        ? collectHookCalls(node.body)
        : [],
    location: nodeRange(node, sf),
  };
}
