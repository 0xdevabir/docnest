import { stat } from "node:fs/promises";

import { AnalysisCache } from "./cache.js";
import { analyzeSourceFile } from "./extractors/index.js";
import { buildModuleGraph, emptyGraph } from "./graph/module-graph.js";
import { loadCompilerOptions, ModuleResolver } from "./graph/resolver.js";
import { findTsConfig, TypeScriptParser } from "./parsers/typescript.js";
import type { AnalysisOptions, AnalysisResult, FileAnalysis } from "./types.js";

export class ASTAnalyzerService {
  private readonly cache = new AnalysisCache();

  /**
   * Analyse a set of source files and build the module graph.
   *
   * The service reuses cached per-file results when the file mtime is
   * unchanged, falling back to fresh analysis only for modified files.
   */
  async analyze(options: AnalysisOptions): Promise<AnalysisResult> {
    const t0 = performance.now();

    const tsConfigPath =
      options.tsConfigPath ??
      findTsConfig(options.root);

    const compilerOptions = loadCompilerOptions(options.root, tsConfigPath);

    // ── Check cache & split into cached / stale ─────────────────────────────
    const toAnalyze: string[] = [];
    const fromCacheMap = new Map<string, FileAnalysis>();

    await Promise.all(
      options.files.map(async (filePath) => {
        const valid = await this.cache.isValid(filePath);
        if (valid) {
          const cached = this.cache.get(filePath);
          if (cached !== undefined) {
            fromCacheMap.set(filePath, cached);
            return;
          }
        }
        toAnalyze.push(filePath);
      }),
    );

    // ── Parse + analyse stale files ─────────────────────────────────────────
    const freshMap = new Map<string, FileAnalysis>();

    if (toAnalyze.length > 0) {
      const parser = new TypeScriptParser(compilerOptions);
      const program = parser.createProgram(toAnalyze);

      for (const filePath of toAnalyze) {
        const sf = program.getSourceFile(filePath);
        if (sf === undefined) continue;

        const analysis = analyzeSourceFile(sf, compilerOptions, options.root);
        freshMap.set(filePath, analysis);

        // Write to cache keyed by mtime
        const mtime = await fileMtime(filePath);
        if (mtime !== undefined) {
          this.cache.set(filePath, analysis, mtime);
        }
      }

      parser.dispose();
    }

    // ── Merge results ────────────────────────────────────────────────────────
    const files = new Map<string, FileAnalysis>([
      ...fromCacheMap,
      ...freshMap,
    ]);

    // ── Build module graph ───────────────────────────────────────────────────
    const resolver = new ModuleResolver(compilerOptions, options.root);
    const graph = options.skipGraph === true
      ? emptyGraph()
      : buildModuleGraph(files, resolver);

    return {
      files,
      graph,
      stats: {
        filesAnalyzed: files.size,
        fromCache: fromCacheMap.size,
        durationMs: performance.now() - t0,
      },
    };
  }

  /** Evict a single file from the cache (call after a write). */
  invalidate(filePath: string): void {
    this.cache.invalidate(filePath);
  }

  clearCache(): void {
    this.cache.clear();
  }

  get cacheSize(): number {
    return this.cache.size;
  }
}

async function fileMtime(filePath: string): Promise<number | undefined> {
  try {
    const st = await stat(filePath);
    return st.mtimeMs;
  } catch {
    return undefined;
  }
}
