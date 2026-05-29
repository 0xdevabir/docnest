/**
 * Single-file persistent JSON cache.
 *
 * Design: one load() at startup reads the whole cache into a Map; all
 * subsequent gets/sets are in-memory (O(1)); one flush() at shutdown writes
 * the dirty map back to disk. This means exactly 2 disk ops per CLI session
 * regardless of how many files are analysed.
 *
 * Atomic writes: write to *.tmp then rename — safe against crashes mid-write.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const SCHEMA_VERSION = "1";

// Max entries to keep in cache. LRU eviction when exceeded.
const DEFAULT_MAX_ENTRIES = 25_000;

// Entries older than this (even if mtime matches) are considered stale.
// 14 days is generous; projects rarely need older snapshots.
const DEFAULT_TTL_MS = 14 * 24 * 60 * 60 * 1_000;

interface CacheFile<T> {
  v: string;
  entries: Record<string, SerializedEntry<T>>;
}

interface SerializedEntry<T> {
  /** File mtime at the time the entry was written. Invalidation key. */
  m: number;
  /** Unix ms timestamp when the entry was written. Used for TTL eviction. */
  t: number;
  /** Cached value. */
  d: T;
}

export class DiskCache<T> {
  private readonly data = new Map<string, SerializedEntry<T>>();
  private dirty = false;
  private loaded = false;

  constructor(
    /** Absolute path to the JSON cache file. */
    private readonly filePath: string,
    private readonly maxEntries = DEFAULT_MAX_ENTRIES,
    private readonly ttlMs = DEFAULT_TTL_MS,
  ) {}

  /**
   * Load cache from disk. Safe to call multiple times (idempotent after first load).
   * Must be called before any `getIfValid` / `set` calls.
   */
  async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;

    try {
      const raw = await readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as CacheFile<T>;

      // Schema version bump → discard old cache
      if (parsed.v !== SCHEMA_VERSION) return;

      const now = Date.now();
      for (const [key, entry] of Object.entries(parsed.entries)) {
        if (now - entry.t <= this.ttlMs) {
          this.data.set(key, entry);
        }
      }
    } catch {
      // File missing, unreadable, or corrupt — start with empty cache
    }
  }

  /**
   * Return cached value if `mtime` matches exactly; otherwise undefined.
   * O(1) Map lookup — no disk I/O.
   */
  getIfValid(key: string, mtime: number): T | undefined {
    const entry = this.data.get(key);
    if (entry === undefined || entry.m !== mtime) return undefined;
    return entry.d;
  }

  /** Store a value. Evicts oldest entries when the cache is full. */
  set(key: string, value: T, mtime: number): void {
    if (this.data.size >= this.maxEntries && !this.data.has(key)) {
      this.evictOldest(Math.ceil(this.maxEntries * 0.05)); // evict 5%
    }
    this.data.set(key, { m: mtime, t: Date.now(), d: value });
    this.dirty = true;
  }

  invalidate(key: string): void {
    if (this.data.delete(key)) this.dirty = true;
  }

  clear(): void {
    this.data.clear();
    this.dirty = true;
  }

  /**
   * Write cache to disk only when dirty. Atomic: writes to *.tmp then renames.
   * Calling flush() on a clean cache is a no-op.
   */
  async flush(): Promise<void> {
    if (!this.dirty) return;

    const dir = path.dirname(this.filePath);
    await mkdir(dir, { recursive: true });

    const payload: CacheFile<T> = {
      v: SCHEMA_VERSION,
      entries: Object.fromEntries(this.data),
    };

    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(payload), "utf-8");
    await rename(tmp, this.filePath);
    this.dirty = false;
  }

  get size(): number {
    return this.data.size;
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private evictOldest(count: number): void {
    // Map iteration order is insertion order — oldest entries first
    for (const key of this.data.keys()) {
      this.data.delete(key);
      if (--count <= 0) break;
    }
  }
}
