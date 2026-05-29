import path from "node:path";

import { DiskCache } from "../core/perf/disk-cache.js";
import type { FileAnalysis } from "./types.js";

const CACHE_FILENAME = "analysis-v1.json";

/**
 * Analysis cache backed by a persistent on-disk store.
 *
 * Life-cycle per CLI invocation:
 *   1. `init(root)` — load the cache file once into memory.
 *   2. `getIfValid(path, mtime)` — sync O(1) lookup, no disk I/O.
 *   3. `set(path, analysis, mtime)` — sync in-memory write.
 *   4. `flush()` — write dirty entries to disk once at the end.
 *
 * Between invocations the disk cache persists, so unchanged files are never
 * re-parsed even across separate `docsmith` commands.
 */
export class AnalysisCache {
  private disk?: DiskCache<FileAnalysis>;
  private initializedFor?: string;

  /**
   * Load the project's disk cache. Idempotent for the same root.
   * Creates the cache directory lazily on first flush.
   */
  async init(root: string): Promise<void> {
    if (this.initializedFor === root) return;
    this.initializedFor = root;

    const cacheFile = path.join(root, ".docsmith", "cache", CACHE_FILENAME);
    this.disk = new DiskCache<FileAnalysis>(cacheFile);
    await this.disk.load();
  }

  /**
   * Return the cached `FileAnalysis` if — and only if — the on-disk mtime
   * matches exactly. Returns `undefined` on any miss or stale entry.
   * Synchronous after `init()`.
   */
  getIfValid(filePath: string, mtime: number): FileAnalysis | undefined {
    return this.disk?.getIfValid(filePath, mtime);
  }

  /** Store an analysis result with the file's current mtime. */
  set(filePath: string, analysis: FileAnalysis, mtime: number): void {
    this.disk?.set(filePath, analysis, mtime);
  }

  /** Write dirty entries to disk. No-op if nothing changed. */
  async flush(): Promise<void> {
    await this.disk?.flush();
  }

  invalidate(filePath: string): void {
    this.disk?.invalidate(filePath);
  }

  clear(): void {
    this.disk?.clear();
  }

  get size(): number {
    return this.disk?.size ?? 0;
  }
}
