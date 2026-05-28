import { stat } from "node:fs/promises";

import type { FileAnalysis } from "./types.js";

interface CacheEntry {
  analysis: FileAnalysis;
  /** File mtime at cache-write time. */
  mtime: number;
}

/**
 * LRU-bounded in-memory analysis cache keyed by absolute file path.
 * Invalidation uses mtime — sufficient for a single-process tool.
 */
export class AnalysisCache {
  private readonly store = new Map<string, CacheEntry>();

  constructor(private readonly maxSize = 2000) {}

  async isValid(filePath: string): Promise<boolean> {
    const entry = this.store.get(filePath);
    if (entry === undefined) return false;
    try {
      const st = await stat(filePath);
      return st.mtimeMs === entry.mtime;
    } catch {
      return false;
    }
  }

  get(filePath: string): FileAnalysis | undefined {
    const entry = this.store.get(filePath);
    if (entry === undefined) return undefined;
    // LRU: refresh position
    this.store.delete(filePath);
    this.store.set(filePath, entry);
    return entry.analysis;
  }

  set(filePath: string, analysis: FileAnalysis, mtime: number): void {
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(filePath, { analysis, mtime });
  }

  invalidate(filePath: string): void {
    this.store.delete(filePath);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
