export { introSection } from "./intro.js";
export { setupSection } from "./setup.js";
export { workflowSection } from "./workflow.js";
export { prGuidelinesSection } from "./pr-guidelines.js";
export { codingStandardsSection } from "./coding-standards.js";
export { repoStructureSection } from "./repo-structure.js";

import type { SectionRenderer } from "../types.js";
import { introSection } from "./intro.js";
import { setupSection } from "./setup.js";
import { workflowSection } from "./workflow.js";
import { prGuidelinesSection } from "./pr-guidelines.js";
import { codingStandardsSection } from "./coding-standards.js";
import { repoStructureSection } from "./repo-structure.js";

export const ALL_SECTIONS: SectionRenderer[] = [
  introSection,
  setupSection,
  workflowSection,
  prGuidelinesSection,
  codingStandardsSection,
  repoStructureSection,
];
