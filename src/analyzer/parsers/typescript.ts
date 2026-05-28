import ts from "typescript";

import type { SourceLanguage } from "../types.js";

const SCRIPT_KIND: Record<SourceLanguage, ts.ScriptKind> = {
  typescript: ts.ScriptKind.TS,
  javascript: ts.ScriptKind.JS,
  tsx: ts.ScriptKind.TSX,
  jsx: ts.ScriptKind.JSX,
};

/**
 * Thin wrapper around ts.createProgram.
 * One program covers all files → shared symbol table, cheaper resolution.
 */
export class TypeScriptParser {
  private program: ts.Program | undefined;

  constructor(private readonly compilerOptions: ts.CompilerOptions) {}

  /** Build (or rebuild) the program for the given set of absolute file paths. */
  createProgram(files: string[]): ts.Program {
    this.program = ts.createProgram(files, this.compilerOptions, undefined, this.program);
    return this.program;
  }

  getProgram(): ts.Program {
    if (this.program === undefined) {
      throw new Error("Call createProgram() before getProgram()");
    }
    return this.program;
  }

  dispose(): void {
    this.program = undefined;
  }
}

/**
 * Parse a single file in isolation (no cross-file type info).
 * Useful for quick single-file queries without a full program.
 */
export function parseSingleFile(
  filePath: string,
  source: string,
  language: SourceLanguage,
): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.ESNext,
    /* setParentNodes */ true,
    SCRIPT_KIND[language],
  );
}

/** Find the nearest tsconfig.json walking up from startDir. */
export function findTsConfig(startDir: string): string | undefined {
  const found = ts.findConfigFile(startDir, ts.sys.fileExists, "tsconfig.json");
  return found;
}
