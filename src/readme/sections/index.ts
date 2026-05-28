export { overviewSection } from "./overview.js";
export { techStackSection } from "./tech-stack.js";
export { setupSection } from "./setup.js";
export { scriptsSection } from "./scripts.js";
export { folderStructureSection } from "./folder-structure.js";
export { architectureSection } from "./architecture.js";
export { usageSection } from "./usage.js";
export { environmentSection, renderEnvironmentSection } from "./environment.js";

import { overviewSection } from "./overview.js";
import { techStackSection } from "./tech-stack.js";
import { setupSection } from "./setup.js";
import { scriptsSection } from "./scripts.js";
import { folderStructureSection } from "./folder-structure.js";
import { architectureSection } from "./architecture.js";
import { usageSection } from "./usage.js";
import { environmentSection } from "./environment.js";
import type { SectionRenderer } from "../types.js";

export const ALL_SECTIONS: SectionRenderer[] = [
  overviewSection,
  techStackSection,
  setupSection,
  scriptsSection,
  folderStructureSection,
  architectureSection,
  usageSection,
  environmentSection,
];
