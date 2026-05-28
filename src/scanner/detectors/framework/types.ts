import type { DetectedFramework } from "../../types.js";

export type { DetectedFramework };

export interface DetectorContext {
  /** All dependency names (prod + dev + peer + optional) */
  deps: Set<string>;
  /** Dev-only dependency names */
  devDeps: Set<string>;
  /** Basenames of detected config files (e.g. "tailwind.config.ts") */
  configFiles: Set<string>;
  /** All scanned relative file paths */
  filePaths: string[];
  /** Basenames of files directly in the project root */
  rootFiles: Set<string>;
  /** All unique directory names across the tree */
  dirNames: Set<string>;
}

export interface FrameworkDetector {
  readonly id: string;
  readonly name: string;
  detect(ctx: DetectorContext): DetectedFramework | null;
}
