export type WatchEventKind = "change" | "rename";

export interface WatchEvent {
  kind: WatchEventKind;
  path: string;
  /** Unix ms timestamp when the FS event was received. */
  timestamp: number;
}

export type FileChangeType = "source" | "config" | "irrelevant";

export interface ChangeBatch {
  /** Source files changed (*.ts, *.tsx, *.js, …). */
  sources: Set<string>;
  /** True when a config or package.json file changed → triggers full rebuild. */
  configChanged: boolean;
  /** Total raw FS events that contributed to this batch. */
  rawEventCount: number;
}

/** Phases the pipeline moves through for each rebuild. */
export type WatchPhase = "idle" | "debouncing" | "analyzing" | "generating" | "error";

export interface RebuildResult {
  phase: "ok" | "error";
  changedFiles: string[];
  fullRebuild: boolean;
  durationMs: number;
  /** Number of output files written. */
  outputCount: number;
  error?: Error;
}

export interface WatchStats {
  /** Total completed rebuilds (success + error). */
  rebuilds: number;
  errors: number;
  filesChanged: number;
  lastRebuildMs: number;
}

export type GenerateTarget = "readme" | "api" | "contributing" | "diagrams";

export interface WatchOptions {
  /** Debounce window in ms. Default: 300. */
  debounceMs?: number;
  /** Extra directory names to exclude from watching. */
  ignore?: string[];
  /** Generators to run on each rebuild. Default: ["readme"]. */
  generate?: GenerateTarget[];
  /**
   * Output file path per generator target.
   * Default: { readme: "README.md", api: "API.md", contributing: "CONTRIBUTING.md",
   *            diagrams: "DIAGRAMS.md" }
   */
  outputs?: Partial<Record<GenerateTarget, string>>;
  /** Show per-file change detail in the terminal. Default: true. */
  verbose?: boolean;
}

export interface WatchCallbacks {
  onReady?(sourceFileCount: number): void;
  onPhase?(phase: WatchPhase, detail?: string): void;
  onBatchStart?(batch: ChangeBatch): void;
  onRebuildComplete?(result: RebuildResult, stats: WatchStats): void;
  onError?(err: Error): void;
  onClose?(): void;
}
