/**
 * Cross-platform file watcher.
 *
 * Strategy:
 *   1. Try `fs.watch(root, { recursive: true })` — works natively on macOS,
 *      Windows, and Linux (Node 20+).
 *   2. If native recursive watch throws (Linux + Node 18/19), fall back to a
 *      manual recursive watcher that opens one non-recursive `fs.watch` per
 *      directory. This costs one file descriptor per directory but works on
 *      all Node 18+ platforms.
 *
 * Memory leak prevention:
 *   - Every `fs.watch` handle is tracked in `this.handles`.
 *   - `close()` clears all handles and removes all listeners.
 *   - No `setInterval` or other persistent timers are used here.
 */

import { readdir, stat } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";

import type { WatchEvent } from "./types.js";

// Directories that are never watched. Kept in sync with IgnoreSystem.
const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", ".next", ".nuxt", "build", "coverage",
  ".turbo", ".nx", ".cache", ".parcel-cache", "out", ".output", ".vercel",
  ".netlify", "tmp", "temp", ".tmp", ".temp", ".docsmith",
  "storybook-static", "__pycache__",
]);

type ChangeHandler = (event: WatchEvent) => void;
type ErrorHandler = (err: Error) => void;

export class FileWatcher {
  private readonly root: string;
  private readonly extraIgnore: Set<string>;
  private handles = new Map<string, ReturnType<typeof watch>>();
  private onChange: ChangeHandler | null = null;
  private onError: ErrorHandler | null = null;
  private closed = false;

  constructor(root: string, extraIgnore: string[] = []) {
    this.root = path.resolve(root);
    this.extraIgnore = new Set(extraIgnore);
  }

  /**
   * Start watching. Calls `onChange` for every relevant FS event.
   * Must be awaited so the manual-recursive fallback can enumerate dirs.
   */
  async start(onChange: ChangeHandler, onError?: ErrorHandler): Promise<void> {
    if (this.closed) throw new Error("FileWatcher has been closed");
    this.onChange = onChange;
    this.onError = onError ?? null;

    try {
      // Attempt native recursive watch
      this.addHandle(this.root, watch(
        this.root,
        { recursive: true, persistent: true },
        (eventType, filename) => this.handleEvent(this.root, eventType, filename),
      ));
    } catch {
      // Fallback: manual recursive — one watcher per directory
      await this.walkAndWatch(this.root);
    }
  }

  close(): void {
    this.closed = true;
    this.onChange = null;
    this.onError = null;
    for (const handle of this.handles.values()) {
      try { handle.close(); } catch { /* ignore */ }
    }
    this.handles.clear();
  }

  get watchedDirCount(): number {
    return this.handles.size;
  }

  // ── Native recursive mode ─────────────────────────────────────────────────

  private handleEvent(
    baseDir: string,
    eventType: string | null,
    filename: string | Buffer | null,
  ): void {
    if (this.closed || filename === null) return;

    // Buffer.toString() and String.toString() both produce plain strings
    const name: string = filename.toString();
    const fullPath: string = path.isAbsolute(name) ? name : path.join(baseDir, name);

    const segments = fullPath.split(path.sep);
    if (segments.some((s: string) => this.shouldIgnore(s))) return;

    this.onChange?.({
      kind: eventType === "rename" ? "rename" : "change",
      path: fullPath,
      timestamp: Date.now(),
    });
  }

  // ── Manual recursive fallback ──────────────────────────────────────────────

  private async walkAndWatch(dir: string): Promise<void> {
    if (this.closed || this.handles.has(dir)) return;

    const dirName = path.basename(dir);
    if (this.shouldIgnore(dirName)) return;

    // Watch this directory
    try {
      const handle = watch(dir, { persistent: true }, (eventType, filename) => {
        if (filename === null) return;
        const name: string = filename.toString();
        this.handleManualEvent(eventType, path.join(dir, name));
      });
      handle.on("error", (err) => this.onError?.(err));
      this.addHandle(dir, handle);
    } catch {
      return; // EACCES or other — skip
    }

    // Recurse into subdirectories
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    await Promise.all(
      entries
        .filter((e) => e.isDirectory() && !this.shouldIgnore(e.name))
        .map((e) => this.walkAndWatch(path.join(dir, e.name))),
    );
  }

  private handleManualEvent(eventType: string | null, fullPath: string): void {
    if (this.closed) return;
    const segments = fullPath.split(path.sep);
    if (segments.some((s: string) => this.shouldIgnore(s))) return;

    this.onChange?.({
      kind: eventType === "rename" ? "rename" : "change",
      path: fullPath,
      timestamp: Date.now(),
    });

    // If a new directory was created, start watching it too
    if (eventType === "rename") {
      stat(fullPath)
        .then((s) => { if (s.isDirectory()) void this.walkAndWatch(fullPath); })
        .catch(() => {
          // Deleted — remove its handle if we have one
          const handle = this.handles.get(fullPath);
          if (handle !== undefined) {
            try { handle.close(); } catch { /* ignore */ }
            this.handles.delete(fullPath);
          }
        });
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private addHandle(key: string, handle: ReturnType<typeof watch>): void {
    handle.on("error", (err) => this.onError?.(err));
    this.handles.set(key, handle);
  }

  private shouldIgnore(name: string): boolean {
    return IGNORED_DIRS.has(name) || this.extraIgnore.has(name);
  }
}
