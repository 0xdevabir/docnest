/**
 * WatchPipeline — the core orchestrator of watch mode.
 *
 * Lifecycle:
 *   start()  → initial full scan + analysis → start file watcher
 *   change   → debounce → ChangeBatch → incremental rebuild
 *   close()  → clean up all handles, timers, and listeners
 *
 * Incremental strategy:
 *   1. Source file changed → invalidate from service cache + re-run analysis
 *      (the persistent disk cache makes unchanged files near-instant to load).
 *   2. Direct consumers of changed files are also invalidated — their resolved
 *      imports may depend on the changed exports.
 *   3. Config / package.json changed → full rescan + full analysis.
 *
 * Concurrent rebuild prevention:
 *   If a rebuild is in progress when the next batch arrives, the batch is held
 *   in `pendingBatch`. On rebuild completion, the pending batch is processed
 *   immediately (no events are lost).
 */

import path from "node:path";

import { writeFile } from "../utils/fs.js";
import { ASTAnalyzerService } from "../analyzer/service.js";
import { findConsumers } from "../analyzer/graph/module-graph.js";
import type { AnalysisResult } from "../analyzer/types.js";
import { scanRepository } from "../scanner/index.js";
import { Debouncer } from "./debouncer.js";
import { FileWatcher } from "./watcher.js";
import type {
  ChangeBatch,
  GenerateTarget,
  RebuildResult,
  WatchCallbacks,
  WatchOptions,
  WatchPhase,
  WatchStats,
} from "./types.js";

const DEFAULT_TARGETS: GenerateTarget[] = ["readme"];

const DEFAULT_OUTPUTS: Record<GenerateTarget, string> = {
  readme:       "README.md",
  api:          "API.md",
  contributing: "CONTRIBUTING.md",
  diagrams:     "DIAGRAMS.md",
};

export class WatchPipeline {
  private readonly root: string;
  private readonly options: WatchOptions;
  private readonly callbacks: WatchCallbacks;

  private watcher: FileWatcher;
  private debouncer: Debouncer;
  private service = new ASTAnalyzerService();

  private phase: WatchPhase = "idle";
  private stats: WatchStats = { rebuilds: 0, errors: 0, filesChanged: 0, lastRebuildMs: 0 };
  private lastSourceFiles: string[] = [];
  private lastAnalysis?: AnalysisResult;

  /** Batch accumulated while a rebuild is in progress. */
  private pendingBatch: ChangeBatch | null = null;
  private isRebuilding = false;

  constructor(root: string, options: WatchOptions = {}, callbacks: WatchCallbacks = {}) {
    this.root = path.resolve(root);
    this.options = options;
    this.callbacks = callbacks;

    this.watcher = new FileWatcher(this.root, options.ignore);
    this.debouncer = new Debouncer(
      options.debounceMs ?? 300,
      (batch) => void this.handleBatch(batch),
    );
  }

  /**
   * Perform an initial full analysis then begin watching.
   * Resolves once watching is active — does not block until close().
   */
  async start(): Promise<void> {
    // Initial scan
    this.setPhase("analyzing", "initial scan");
    const structure = await scanRepository({ root: this.root });
    this.lastSourceFiles = structure.files
      .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f.name))
      .map((f) => f.path);

    // Initial analysis (uses disk cache for warm starts)
    this.lastAnalysis = await this.service.analyze({
      root: this.root,
      files: this.lastSourceFiles,
    });

    // Initial generation
    this.setPhase("generating", "initial build");
    await this.runGenerators([]);

    this.setPhase("idle");
    this.callbacks.onReady?.(this.lastSourceFiles.length);

    // Start watching
    await this.watcher.start(
      (event) => this.debouncer.add(event),
      (err)   => this.callbacks.onError?.(err),
    );
  }

  close(): void {
    this.debouncer.dispose();
    this.watcher.close();
    this.callbacks.onClose?.();
  }

  get currentPhase(): WatchPhase {
    return this.phase;
  }

  get currentStats(): Readonly<WatchStats> {
    return this.stats;
  }

  // ── Rebuild orchestration ──────────────────────────────────────────────────

  private async handleBatch(batch: ChangeBatch): Promise<void> {
    if (this.isRebuilding) {
      // Merge into pending so no events are lost
      this.pendingBatch ??= emptyBatch();
      batch.sources.forEach((s) => this.pendingBatch!.sources.add(s));
      if (batch.configChanged) this.pendingBatch!.configChanged = true;
      this.pendingBatch!.rawEventCount += batch.rawEventCount;
      return;
    }

    this.isRebuilding = true;
    const t0 = Date.now();
    let result: RebuildResult;

    try {
      this.callbacks.onBatchStart?.(batch);
      result = await (batch.configChanged
        ? this.fullRebuild(batch)
        : this.incrementalRebuild(batch));
    } catch (rawErr) {
      const err = rawErr instanceof Error ? rawErr : new Error(String(rawErr));
      result = {
        phase:        "error",
        changedFiles: [...batch.sources],
        fullRebuild:  batch.configChanged,
        durationMs:   Date.now() - t0,
        outputCount:  0,
        error:        err,
      };
      this.callbacks.onError?.(err);
      this.stats.errors++;
      this.setPhase("error", err.message);
    }

    if (result.phase === "ok") {
      this.stats.rebuilds++;
      this.stats.filesChanged += result.changedFiles.length;
      this.stats.lastRebuildMs = result.durationMs;
      this.callbacks.onRebuildComplete?.(result, { ...this.stats });
      this.setPhase("idle");
    }

    this.isRebuilding = false;

    // Drain any events that arrived mid-rebuild
    if (this.pendingBatch !== null) {
      const pending = this.pendingBatch;
      this.pendingBatch = null;
      void this.handleBatch(pending);
    }
  }

  private async incrementalRebuild(batch: ChangeBatch): Promise<RebuildResult> {
    const t0 = Date.now();
    const changed = [...batch.sources];

    // Invalidate changed files from service's in-memory + disk cache
    for (const fp of changed) this.service.invalidate(fp);

    // Also invalidate direct consumers — their resolved imports may have changed
    if (this.lastAnalysis !== undefined) {
      for (const fp of changed) {
        const consumers = findConsumers(this.lastAnalysis.graph, fp, false);
        for (const c of consumers) this.service.invalidate(c);
      }
    }

    this.setPhase("analyzing", `${changed.length} file(s) changed`);
    this.lastAnalysis = await this.service.analyze({
      root:  this.root,
      files: this.lastSourceFiles,
    });

    this.setPhase("generating");
    const outputCount = await this.runGenerators(changed);

    return {
      phase:       "ok",
      changedFiles: changed,
      fullRebuild: false,
      durationMs:  Date.now() - t0,
      outputCount,
    };
  }

  private async fullRebuild(batch: ChangeBatch): Promise<RebuildResult> {
    const t0 = Date.now();

    this.setPhase("analyzing", "config changed — full rebuild");

    // Re-scan for new/deleted files
    const structure = await scanRepository({ root: this.root });
    this.lastSourceFiles = structure.files
      .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f.name))
      .map((f) => f.path);

    this.lastAnalysis = await this.service.analyze({
      root:  this.root,
      files: this.lastSourceFiles,
    });

    this.setPhase("generating");
    const outputCount = await this.runGenerators([]);

    return {
      phase:       "ok",
      changedFiles: [...batch.sources],
      fullRebuild: true,
      durationMs:  Date.now() - t0,
      outputCount,
    };
  }

  // ── Generator dispatch ─────────────────────────────────────────────────────

  private async runGenerators(changedFiles: string[]): Promise<number> {
    const targets  = this.options.generate ?? DEFAULT_TARGETS;
    const outputs  = { ...DEFAULT_OUTPUTS, ...this.options.outputs };
    let count = 0;

    for (const target of targets) {
      const outFile = path.resolve(this.root, outputs[target] ?? DEFAULT_OUTPUTS[target]);
      try {
        const content = await dispatchGenerator(target, this.root);
        await writeFile(outFile, content);
        count++;
      } catch (err) {
        // Generator failure is non-fatal in watch mode — log and continue
        this.callbacks.onError?.(
          err instanceof Error ? err : new Error(`${target} generator failed: ${String(err)}`),
        );
      }
    }

    void changedFiles; // available for future partial-regen optimisation
    return count;
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private setPhase(phase: WatchPhase, detail?: string): void {
    this.phase = phase;
    this.callbacks.onPhase?.(phase, detail);
  }
}

// ── Generator dispatch (lazy imports to keep startup fast) ────────────────────

async function dispatchGenerator(target: GenerateTarget, root: string): Promise<string> {
  switch (target) {
    case "readme": {
      const { generateReadme } = await import("../readme/index.js");
      const result = await generateReadme(root, {});
      return result.content;
    }
    case "api": {
      const { generateApiDocs } = await import("../api-docs/index.js");
      const result = await generateApiDocs(root, {});
      return result.content;
    }
    case "contributing": {
      const { generateContributing } = await import("../contributing/index.js");
      const result = await generateContributing(root, {});
      return result.content;
    }
    case "diagrams": {
      const { generateDiagrams } = await import("../diagrams/index.js");
      const result = await generateDiagrams(root, {});
      return result.content;
    }
    default: {
      const _: never = target;
      throw new Error(`Unknown generate target: ${String(_)}`);
    }
  }
}

function emptyBatch(): ChangeBatch {
  return { sources: new Set(), configChanged: false, rawEventCount: 0 };
}
