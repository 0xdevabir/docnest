export { buildContributingContext } from "./context.js";
export { renderContributing, registerSection } from "./renderer.js";
export { getTemplate, listTemplates } from "./templates/index.js";
export { ALL_SECTIONS } from "./sections/index.js";

export type {
  ContributingContext,
  ContributingOptions,
  ContributingResult,
  ContributingTemplate,
  RenderedSection,
  SectionRenderer,
  PackageManager,
} from "./types.js";

import { buildContributingContext } from "./context.js";
import { renderContributing } from "./renderer.js";
import type { ContributingOptions, ContributingResult } from "./types.js";

export async function generateContributing(
  root: string,
  opts: ContributingOptions = {},
): Promise<ContributingResult> {
  const ctx = await buildContributingContext(root, opts);
  return renderContributing(ctx, opts);
}
