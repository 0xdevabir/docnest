import { stat } from "node:fs/promises";

import { pLimit } from "../core/perf/pool.js";
import { AnalysisCache } from "./cache.js";
import { analyzeSourceFile } from "./extractors/index.js";
import { buildModuleGraph, emptyGraph } from "./graph/module-graph.js";
import { loadCompilerOptions, ModuleResolver } from "./graph/resolver.js";
import { findTsConfig, TypeScriptParser } from "./parsers/typescript.js";
import type { AnalysisOptions, AnalysisResult, FileAnalysis } from "./types.js";

// How many concurrent stat() calls to fire at once.
// 64 saturates a modern SSD without overloading the libuv I/O thread pool.
const STAT_CONCURRENCY = 64;

// Matches test/spec files and test-only directories.
const TEST_FILE_RE =
  /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$|[/\\]__(tests?|mocks?|fixtures?|stubs?)__[/\\]/;

export class ASTAnalyzerService {
  private readonly cache = new AnalysisCache();

  /**
   * Analyse a set of source files and build the module graph.
   *
   * Optimisations vs. naive approach:
   *   - Single bounded-concurrency stat() pass instead of two unbounded passes.
   *   - Persistent disk cache: unchanged files are never re-parsed across
   *     CLI invocations (.docsmith/cache/analysis-v1.json).
   *   - Test files excluded by default (set skipTestFiles:false to include).
   *   - TypeScript program built only for the uncached file subset.
   */
  async analyze(options: AnalysisOptions): Promise<AnalysisResult> {
    const t0 = performance.now();

    // 0. Candidate filtering ──────────────────────────────────────────────────
    const candidates =
      options.skipTestFiles === false
        ? options.files
        : options.files.filter((f) => !TEST_FILE_RE.test(f));

    // 1. Persistent cache init (single disk read) ─────────────────────────────
    await this.cache.init(options.root);

    // 2. Compiler config (fast ~1ms read; always needed for graph resolver) ───
    const tsConfigPath = options.tsConfigPath ?? findTsConfig(options.root);
    const compilerOptions = loadCompilerOptions(options.root, tsConfigPath);

    // 3. Batch stat — bounded concurrency, single pass ────────────────────────
    //    Replaces: Promise.all(files.map(isValid)) + per-file fileMtime()
    //    Old cost: 2 × N syscalls, all unthrottled
    //    New cost: N syscalls, max STAT_CONCURRENCY in-flight
    const mtimes = await batchStat(candidates, STAT_CONCURRENCY);

    // 4. Partition ─────────────────────────────────────────────────────────────
    const fromCache = new Map<string, FileAnalysis>();
    const toAnalyze: string[] = [];

    for (const [fp, mtime] of mtimes) {
      if (mtime === null) continue; // file disappeared between scan and here

      const hit = this.cache.getIfValid(fp, mtime);
      if (hit !== undefined) {
        fromCache.set(fp, hit);
      } else {
        toAnalyze.push(fp);
      }
    }

    // 5. TypeScript analysis — only for cache misses ──────────────────────────
    const fresh = new Map<string, FileAnalysis>();

    if (toAnalyze.length > 0) {
      const parser = new TypeScriptParser(compilerOptions);
      const program = parser.createProgram(toAnalyze);

      for (const fp of toAnalyze) {
        const sf = program.getSourceFile(fp);
        if (sf === undefined) continue;

        const analysis = analyzeSourceFile(sf, compilerOptions, options.root);
        fresh.set(fp, analysis);

        // Use the mtime we already fetched — eliminates the second stat() call
        const mtime = mtimes.get(fp);
        if (mtime !== null && mtime !== undefined) {
          this.cache.set(fp, analysis, mtime);
        }
      }

      parser.dispose();
    }

    // 6. Flush cache (single disk write, no-op when nothing changed) ──────────
    await this.cache.flush();

    // 7. Module graph over the full merged file set ───────────────────────────
    const allFiles = new Map<string, FileAnalysis>([...fromCache, ...fresh]);
    const resolver = new ModuleResolver(compilerOptions, options.root);
    const graph =
      options.skipGraph === true
        ? emptyGraph()
        : buildModuleGraph(allFiles, resolver);

    return {
      files: allFiles,
      graph,
      stats: {
        filesAnalyzed: allFiles.size,
        fromCache: fromCache.size,
        durationMs: performance.now() - t0,
      },
    };
  }

  /** Evict a file from both in-memory and persistent cache. */
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Stat `files` with at most `concurrency` simultaneous I/O operations.
 * Returns a Map of filePath → mtimeMs | null (null = file vanished).
 */
async function batchStat(
  files: string[],
  concurrency: number,
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();

  await pLimit(
    files.map((fp) => async () => {
      try {
        const s = await stat(fp);
        result.set(fp, s.mtimeMs);
      } catch {
        result.set(fp, null);
      }
    }),
    concurrency,
  );

  return result;
}
