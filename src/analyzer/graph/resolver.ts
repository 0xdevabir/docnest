import ts from "typescript";

/** Resolves module specifiers to absolute file paths using the TypeScript resolver. */
export class ModuleResolver {
  constructor(
    private readonly compilerOptions: ts.CompilerOptions,
    private readonly rootDir: string,
  ) {}

  /**
   * Resolve a specifier from `fromFile` to an absolute path.
   * Returns undefined for unresolvable or external modules.
   */
  resolve(specifier: string, fromFile: string): string | undefined {
    const result = ts.resolveModuleName(
      specifier,
      fromFile,
      this.compilerOptions,
      ts.sys,
    );
    const mod = result.resolvedModule;
    if (mod === undefined) return undefined;
    // Skip external library imports — they're tracked as GraphNodes by the graph builder
    if (mod.isExternalLibraryImport === true) return mod.resolvedFileName;
    return mod.resolvedFileName;
  }

  isExternal(resolvedPath: string): boolean {
    return resolvedPath.includes("node_modules");
  }

  isWithinRoot(resolvedPath: string): boolean {
    const normalised = resolvedPath.replace(/\\/g, "/");
    const root = this.rootDir.replace(/\\/g, "/");
    return normalised.startsWith(root) && !this.isExternal(resolvedPath);
  }
}

export function loadCompilerOptions(
  rootDir: string,
  tsConfigPath?: string,
): ts.CompilerOptions {
  if (tsConfigPath !== undefined) {
    const configFile = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
    if (configFile.error === undefined) {
      const parsed = ts.parseJsonConfigFileContent(
        configFile.config as Record<string, unknown>,
        ts.sys,
        rootDir,
      );
      return {
        ...parsed.options,
        noEmit: true,
        skipLibCheck: true,
        allowJs: true,
      };
    }
  }

  // Sensible defaults for analysis when no tsconfig is available
  return {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: true,
    checkJs: false,
    jsx: ts.JsxEmit.ReactJSX,
    noEmit: true,
    skipLibCheck: true,
    resolveJsonModule: true,
    esModuleInterop: true,
  };
}
