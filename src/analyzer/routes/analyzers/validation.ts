import ts from "typescript";

import { walkNode } from "../../extractors/utils.js";
import type { ValidationInfo, ValidationLib } from "../types.js";

// Maps call/import patterns → validation library.
const LIB_PATTERNS: ReadonlyArray<[RegExp, ValidationLib]> = [
  [/^z\b|zod/i, "zod"],
  [/^joi\b|@hapi\/joi/i, "joi"],
  [/^yup\b/i, "yup"],
  [/IsString|IsEmail|IsNumber|IsIn|@Body|@Query|class-validator/i, "class-validator"],
  [/Type\(|@sinclair\/typebox|typebox/i, "typebox"],
];

// Methods that trigger schema validation when called on a schema object.
const VALIDATION_METHODS = new Set(["parse", "safeParse", "validate", "validateAsync", "check"]);

export function inferValidationLib(text: string): ValidationLib {
  for (const [pattern, lib] of LIB_PATTERNS) {
    if (pattern.test(text)) return lib;
  }
  return "unknown";
}

/**
 * Walk a handler node looking for schema.parse/safeParse/validate calls
 * and similar validation patterns.
 */
export function extractValidation(
  sf: ts.SourceFile,
  routeNode: ts.Node,
): ValidationInfo[] {
  const validations: ValidationInfo[] = [];

  walkNode(routeNode, (n) => {
    if (!ts.isCallExpression(n)) return;
    if (!ts.isPropertyAccessExpression(n.expression)) return;

    const method = n.expression.name.text;
    if (!VALIDATION_METHODS.has(method)) return;

    const schemaExpr = n.expression.expression;
    const schemaText = schemaExpr.getText(sf);
    const lib = inferValidationLib(schemaText);
    if (lib === "unknown") return;

    const target = inferValidationTarget(n, sf);
    const schemaName = ts.isIdentifier(schemaExpr) ? schemaExpr.text : undefined;

    validations.push({
      lib,
      target,
      ...(schemaName !== undefined && { schemaName }),
      inline: schemaName === undefined,
    });
  });

  return validations;
}

/**
 * Heuristic: look at what the validation call receives as its first arg
 * to determine which part of the request is being validated.
 */
function inferValidationTarget(
  call: ts.CallExpression,
  sf: ts.SourceFile,
): ValidationInfo["target"] {
  const argText = call.arguments[0]?.getText(sf) ?? "";
  if (/req\.body|c\.req\.json|request\.body|body/i.test(argText)) return "body";
  if (/req\.query|c\.req\.query|request\.query|query/i.test(argText)) return "query";
  if (/req\.params|c\.req\.param|request\.params|params/i.test(argText)) return "params";
  if (/req\.headers|c\.req\.header|request\.headers|headers/i.test(argText)) return "headers";
  return "unknown";
}
