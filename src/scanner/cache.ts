import type { CachedScan, ProjectStructure } from "./types.js";

// 5 minutes — long enough to share across commands in one CLI session,
// short enough that stale data after a file change isn't a real concern.
const DEFAULT_TTL_MS = 5 * 60 * 1_000;
const DEFAULT_MAX_SIZE = 20;

/**
 * LRU scan cache keyed by root path.
 * Invalidates when root directory mtime changes or TTL expires.
 */
export class ScanCache {
  private readonly store = new Map<string, CachedScan>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = DEFAULT_MAX_SIZE, ttlMs = DEFAULT_TTL_MS) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(root: string, currentRootMtime: number): ProjectStructure | null {
    const entry = this.store.get(root);
    if (!entry) return null;

    const stale =
      entry.rootMtime !== currentRootMtime ||
      Date.now() - entry.timestamp > this.ttlMs;

    if (stale) {
      this.store.delete(root);
      return null;
    }

    // Refresh recency (LRU: delete + re-insert)
    this.store.delete(root);
    this.store.set(root, entry);
    return entry.result;
  }

  set(root: string, rootMtime: number, result: ProjectStructure): void {
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(root, { result, rootMtime, timestamp: Date.now() });
  }

  invalidate(root: string): void {
    this.store.delete(root);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
