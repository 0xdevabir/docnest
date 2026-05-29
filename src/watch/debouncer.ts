/**
 * Collects FS events during a quiet window, then fires once with a ChangeBatch.
 *
 * Design:
 *   - A "rename" or "change" event resets the debounce timer.
 *   - Only source files and config files contribute to the batch; all other
 *     files are dropped immediately (no timer reset).
 *   - `mergeInto(other)` lets the pipeline accumulate events that arrive
 *     while a rebuild is already in progress, without losing changes.
 */

import type { ChangeBatch, WatchEvent } from "./types.js";

const SOURCE_EXT_RE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const CONFIG_FILE_RE = /docsmith\.config\.|(?:^|[/\\])package\.json$|tsconfig(?:\.\w+)?\.json$/;

export class Debouncer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private sources = new Set<string>();
  private configChanged = false;
  private rawCount = 0;

  constructor(
    private readonly delayMs: number,
    private readonly onFire: (batch: ChangeBatch) => void,
  ) {}

  /** Feed an event. Returns the classified change type (for callers to log). */
  add(event: WatchEvent): "source" | "config" | "irrelevant" {
    const { path } = event;

    if (CONFIG_FILE_RE.test(path)) {
      this.rawCount++;
      this.configChanged = true;
      this.schedule();
      return "config";
    }

    if (SOURCE_EXT_RE.test(path)) {
      this.rawCount++;
      this.sources.add(path);
      this.schedule();
      return "source";
    }

    return "irrelevant"; // no timer reset for irrelevant files
  }

  /**
   * Cancel the pending timer and merge accumulated changes into `target`.
   * Used by the pipeline to carry over events that arrived mid-rebuild.
   */
  drainInto(target: ChangeBatch): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    for (const s of this.sources) target.sources.add(s);
    if (this.configChanged) target.configChanged = true;
    target.rawEventCount += this.rawCount;
    this.reset();
  }

  dispose(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.reset();
  }

  get hasPending(): boolean {
    return this.sources.size > 0 || this.configChanged;
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private schedule(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fire(), this.delayMs);
  }

  private fire(): void {
    this.timer = null;
    if (!this.hasPending) return;

    const batch: ChangeBatch = {
      sources:      new Set(this.sources),
      configChanged: this.configChanged,
      rawEventCount: this.rawCount,
    };
    this.reset();
    this.onFire(batch);
  }

  private reset(): void {
    this.sources.clear();
    this.configChanged = false;
    this.rawCount = 0;
  }
}
