import ts from "typescript";

import type {
  ClassEntry,
  MethodEntry,
  PropertyEntry,
} from "../types.js";
import {
  extractParams,
  getDecoratorNames,
  getJsdoc,
  getVisibility,
  hasModifier,
  isDefaultNode,
  isExportedNode,
  nodeRange,
} from "./utils.js";

export function extractClasses(sf: ts.SourceFile): ClassEntry[] {
  const classes: ClassEntry[] = [];

  for (const stmt of sf.statements) {
    if (!ts.isClassDeclaration(stmt) || stmt.name === undefined) continue;
    classes.push(fromClassDeclaration(stmt, sf));
  }

  return classes;
}

function fromClassDeclaration(
  node: ts.ClassDeclaration,
  sf: ts.SourceFile,
): ClassEntry {
  const methods: MethodEntry[] = [];
  const properties: PropertyEntry[] = [];

  for (const member of node.members) {
    if (ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member)) {
      const name = ts.isConstructorDeclaration(member)
        ? "constructor"
        : memberName(member.name);
      if (name === null) continue;
      const returnType =
        ts.isMethodDeclaration(member) && member.type !== undefined
          ? member.type.getText(sf)
          : undefined;
      methods.push({
        name,
        kind: ts.isConstructorDeclaration(member) ? "constructor" : "method",
        isAsync: hasModifier(member, ts.SyntaxKind.AsyncKeyword),
        isStatic: hasModifier(member, ts.SyntaxKind.StaticKeyword),
        isAbstract: hasModifier(member, ts.SyntaxKind.AbstractKeyword),
        visibility: getVisibility(member),
        params: extractParams(member.parameters, sf),
        ...(returnType !== undefined && { returnType }),
        location: nodeRange(member, sf),
      });
      continue;
    }

    if (ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)) {
      const name = memberName(member.name);
      if (name === null) continue;
      const returnType =
        ts.isGetAccessorDeclaration(member) && member.type !== undefined
          ? member.type.getText(sf)
          : undefined;
      methods.push({
        name,
        kind: ts.isGetAccessorDeclaration(member) ? "getter" : "setter",
        isAsync: false,
        isStatic: hasModifier(member, ts.SyntaxKind.StaticKeyword),
        isAbstract: hasModifier(member, ts.SyntaxKind.AbstractKeyword),
        visibility: getVisibility(member),
        params: extractParams(member.parameters, sf),
        ...(returnType !== undefined && { returnType }),
        location: nodeRange(member, sf),
      });
      continue;
    }

    if (ts.isPropertyDeclaration(member)) {
      const name = memberName(member.name);
      if (name === null) continue;
      const type = member.type?.getText(sf);
      properties.push({
        name,
        ...(type !== undefined && { type }),
        isStatic: hasModifier(member, ts.SyntaxKind.StaticKeyword),
        isReadonly: hasModifier(member, ts.SyntaxKind.ReadonlyKeyword),
        isAbstract: hasModifier(member, ts.SyntaxKind.AbstractKeyword),
        isOptional: member.questionToken !== undefined,
        visibility: getVisibility(member),
        location: nodeRange(member, sf),
      });
    }
  }

  const extendsClause = node.heritageClauses?.find(
    (h) => h.token === ts.SyntaxKind.ExtendsKeyword,
  );
  const implementsClause = node.heritageClauses?.find(
    (h) => h.token === ts.SyntaxKind.ImplementsKeyword,
  );
  const extendsText = extendsClause?.types[0]?.expression.getText(sf);
  const jsdoc = getJsdoc(node, sf);

  return {
    name: node.name!.text,
    isAbstract: hasModifier(node, ts.SyntaxKind.AbstractKeyword),
    isExported: isExportedNode(node),
    isDefault: isDefaultNode(node),
    ...(extendsText !== undefined && { extends: extendsText }),
    implements:
      implementsClause?.types.map((t) => t.expression.getText(sf)) ?? [],
    decorators: getDecoratorNames(node),
    methods,
    properties,
    ...(jsdoc !== undefined && { jsdoc }),
    location: nodeRange(node, sf),
  };
}

function memberName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  if (ts.isNumericLiteral(name)) return name.text;
  return null;
}
