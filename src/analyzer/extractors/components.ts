import ts from "typescript";

import type { ComponentEntry, ComponentKind } from "../types.js";
import {
  bodyHasJsx,
  collectHookCalls,
  hasReactReturnType,
  isDefaultNode,
  isExportedNode,
  nodeRange,
} from "./utils.js";

const COMPONENT_NAME = /^[A-Z]/;
const REACT_COMPONENT_BASES = new Set(["Component", "PureComponent"]);

export function extractComponents(
  sf: ts.SourceFile,
  isServerComponentFile: boolean,
): ComponentEntry[] {
  const components: ComponentEntry[] = [];

  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name !== undefined) {
      if (COMPONENT_NAME.test(stmt.name.text) && isFunctionComponent(stmt, sf)) {
        components.push(
          fromFunction(stmt, stmt.name.text, "function", isServerComponentFile, sf),
        );
      }
      continue;
    }

    if (ts.isVariableStatement(stmt)) {
      const exported = isExportedNode(stmt);
      const isDefault = isDefaultNode(stmt);
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        if (!COMPONENT_NAME.test(decl.name.text)) continue;
        const init = decl.initializer;
        if (init === undefined) continue;

        const hocKind = detectHoc(init);
        if (hocKind !== null) {
          components.push({
            name: decl.name.text,
            kind: hocKind,
            isExported: exported,
            isDefault,
            hooksUsed: [],
            isServerComponent: isServerComponentFile,
            location: nodeRange(decl, sf),
          });
          continue;
        }

        if (ts.isFunctionExpression(init) || ts.isArrowFunction(init)) {
          if (isFunctionComponent(init, sf)) {
            const entry = fromFunction(
              init,
              decl.name.text,
              "function",
              isServerComponentFile,
              sf,
            );
            // Variable statements carry export/default from the parent statement
            components.push({ ...entry, isExported: exported, isDefault });
          }
        }
      }
      continue;
    }

    if (ts.isClassDeclaration(stmt) && stmt.name !== undefined) {
      if (COMPONENT_NAME.test(stmt.name.text) && isClassComponent(stmt)) {
        const propsType = extractClassPropsType(stmt, sf);
        components.push({
          name: stmt.name.text,
          kind: "class",
          isExported: isExportedNode(stmt),
          isDefault: isDefaultNode(stmt),
          ...(propsType !== undefined && { propsType }),
          hooksUsed: [],
          isServerComponent: isServerComponentFile,
          location: nodeRange(stmt, sf),
        });
      }
    }
  }

  return components;
}

function isFunctionComponent(
  node: ts.FunctionLikeDeclaration,
  sf: ts.SourceFile,
): boolean {
  return bodyHasJsx(node) || hasReactReturnType(node, sf);
}

function fromFunction(
  node: ts.FunctionLikeDeclaration,
  name: string,
  kind: ComponentKind,
  isServerComponent: boolean,
  sf: ts.SourceFile,
): ComponentEntry {
  const propsType = extractFunctionPropsType(node, sf);
  const hooksUsed = node.body !== undefined ? collectHookCalls(node.body) : [];
  return {
    name,
    kind,
    isExported: ts.isFunctionDeclaration(node) ? isExportedNode(node) : false,
    isDefault: ts.isFunctionDeclaration(node) ? isDefaultNode(node) : false,
    ...(propsType !== undefined && { propsType }),
    hooksUsed,
    isServerComponent,
    location: nodeRange(node, sf),
  };
}

function detectHoc(node: ts.Expression): ComponentKind | null {
  if (!ts.isCallExpression(node)) return null;
  const callee = node.expression;
  if (isCallee(callee, "memo", "React")) return "memo";
  if (isCallee(callee, "forwardRef", "React")) return "forwardRef";
  if (isCallee(callee, "lazy", "React")) return "lazy";
  return null;
}

function isCallee(node: ts.Expression, name: string, namespace: string): boolean {
  if (ts.isIdentifier(node)) return node.text === name;
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === namespace &&
    node.name.text === name
  );
}

function isClassComponent(node: ts.ClassDeclaration): boolean {
  const ext = node.heritageClauses?.find(
    (h) => h.token === ts.SyntaxKind.ExtendsKeyword,
  );
  if (ext === undefined) return false;
  const base = ext.types[0]?.expression;
  if (base === undefined) return false;
  if (ts.isIdentifier(base)) return REACT_COMPONENT_BASES.has(base.text);
  return (
    ts.isPropertyAccessExpression(base) &&
    ts.isIdentifier(base.expression) &&
    base.expression.text === "React" &&
    REACT_COMPONENT_BASES.has(base.name.text)
  );
}

function extractFunctionPropsType(
  node: ts.FunctionLikeDeclaration,
  sf: ts.SourceFile,
): string | undefined {
  const firstParam = node.parameters[0];
  if (firstParam === undefined) return undefined;
  const type = firstParam.type;
  if (type === undefined) return undefined;
  if (ts.isTypeReferenceNode(type)) return type.getText(sf);
  return undefined;
}

function extractClassPropsType(
  node: ts.ClassDeclaration,
  sf: ts.SourceFile,
): string | undefined {
  const ext = node.heritageClauses?.find(
    (h) => h.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const typeArgs = ext?.types[0]?.typeArguments;
  if (typeArgs === undefined || typeArgs.length === 0) return undefined;
  return typeArgs[0]?.getText(sf);
}
