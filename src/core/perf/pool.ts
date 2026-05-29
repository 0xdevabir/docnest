/**
 * Bounded concurrency pool — a zero-dependency p-limit equivalent.
 *
 * JS is single-threaded so the `cursor++` increment is atomic.
 * Tasks run eagerly up to `concurrency`; each slot picks the next task when free.
 *
 * @example
 * const mtimes = await pLimit(
 *   files.map(fp => () => stat(fp).then(s => s.mtimeMs).catch(() => null)),
 *   64,
 * );
 */
export async function pLimit<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const idx = cursor++;
      if (idx >= tasks.length) return;
      results[idx] = await tasks[idx]!();
    }
  }

  const slots = Math.min(Math.max(1, concurrency), tasks.length);
  if (slots === 0) return results;
  await Promise.all(Array.from({ length: slots }, worker));
  return results;
}

/**
 * Run an async function over an array with bounded concurrency.
 * Convenience wrapper around `pLimit` for mapping use-cases.
 */
export async function pMap<T, R>(
  items: ReadonlyArray<T>,
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  return pLimit(
    items.map((item, idx) => () => fn(item, idx)),
    concurrency,
  );
}
