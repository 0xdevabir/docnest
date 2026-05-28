export { buildReadmeContext } from "./context.js";
export { renderReadme, registerSection } from "./renderer.js";
export { getTemplate, listTemplates } from "./templates/index.js";
export { ALL_SECTIONS } from "./sections/index.js";

export type {
  ReadmeContext,
  ReadmeOptions,
  ReadmeResult,
  ReadmeTemplate,
  RenderedSection,
  SectionRenderer,
  PackageManager,
} from "./types.js";

import { buildReadmeContext } from "./context.js";
import { renderReadme } from "./renderer.js";
import type { ReadmeOptions, ReadmeResult } from "./types.js";

/** High-level helper: scan + analyse + render in one call. */
export async function generateReadme(
  root: string,
  opts: ReadmeOptions = {},
): Promise<ReadmeResult> {
  const ctx = await buildReadmeContext(root, opts);
  return renderReadme(ctx, opts);
}
