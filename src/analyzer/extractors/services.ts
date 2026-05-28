import ts from "typescript";

import type { ClassEntry, ServiceEntry, ServiceKind } from "../types.js";
import { getDecoratorNames, isExportedNode, nodeRange, walkNode } from "./utils.js";

const SERVICE_DECORATORS = new Set([
  "Injectable",
  "Service",
  "Singleton",
  "Component",
  "Controller",
  "Provider",
]);

export function extractServices(
  sf: ts.SourceFile,
  classes: ClassEntry[],
): ServiceEntry[] {
  const services: ServiceEntry[] = [];
  const seen = new Set<string>();

  // ── Decorator-based services (NestJS, TypeDI, InversifyJS, etc.) ──────────
  for (const stmt of sf.statements) {
    if (!ts.isClassDeclaration(stmt) || stmt.name === undefined) continue;
    const decorators = getDecoratorNames(stmt);
    const isService = decorators.some((d) => SERVICE_DECORATORS.has(d.replace(/^.*\./, "")));
    if (!isService) continue;

    seen.add(stmt.name.text);
    services.push({
      name: stmt.name.text,
      kind: "class",
      isExported: isExportedNode(stmt),
      decorators,
      location: nodeRange(stmt, sf),
    });
  }

  // ── Singleton pattern: static instance property ───────────────────────────
  for (const cls of classes) {
    if (seen.has(cls.name)) continue;
    const hasSingletonMember =
      cls.properties.some(
        (p) => p.isStatic && /^instance$|^_instance$/.test(p.name),
      ) ||
      cls.methods.some(
        (m) => m.isStatic && /^getInstance$|^instance$/.test(m.name),
      );
    if (!hasSingletonMember) continue;
    seen.add(cls.name);
    services.push({
      name: cls.name,
      kind: "singleton",
      isExported: cls.isExported,
      decorators: cls.decorators,
      location: cls.location,
    });
  }

  // ── Exported instance: export const service = new MyService() ────────────
  walkNode(sf, (n) => {
    if (!ts.isVariableStatement(n)) return;
    if (!isExportedNode(n)) return;
    for (const decl of n.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      if (!ts.isNewExpression(decl.initializer ?? ts.factory.createNull())) continue;
      const init = decl.initializer as ts.NewExpression;
      if (!ts.isIdentifier(init.expression)) continue;
      const className = init.expression.text;
      // Only surface if the instantiated class is known to us
      if (!classes.some((c) => c.name === className)) return;
      if (seen.has(decl.name.text)) continue;
      seen.add(decl.name.text);
      services.push({
        name: decl.name.text,
        kind: "instance",
        isExported: true,
        decorators: [],
        location: nodeRange(n, sf),
      });
    }
    return "stop";
  });

  return services;
}
