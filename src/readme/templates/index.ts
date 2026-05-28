import type { ReadmeTemplate } from "../types.js";

const defaultTemplate: ReadmeTemplate = {
  name: "default",
  description: "Full README for a standard application",
  sections: [
    "overview",
    "tech-stack",
    "setup",
    "environment",
    "scripts",
    "folder-structure",
    "architecture",
    "usage",
  ],
};

const libraryTemplate: ReadmeTemplate = {
  name: "library",
  description: "README optimised for published libraries and packages",
  sections: [
    "overview",
    "tech-stack",
    "setup",
    "usage",
    "scripts",
    "folder-structure",
    "architecture",
  ],
  exclude: ["environment"],
};

const apiTemplate: ReadmeTemplate = {
  name: "api",
  description: "README focused on API / backend services",
  sections: [
    "overview",
    "tech-stack",
    "setup",
    "environment",
    "usage",
    "architecture",
    "scripts",
    "folder-structure",
  ],
};

const minimalTemplate: ReadmeTemplate = {
  name: "minimal",
  description: "Concise README with just the essentials",
  sections: ["overview", "setup", "scripts"],
};

const TEMPLATES = new Map<string, ReadmeTemplate>([
  ["default", defaultTemplate],
  ["library", libraryTemplate],
  ["api", apiTemplate],
  ["minimal", minimalTemplate],
]);

export function getTemplate(name?: string): ReadmeTemplate {
  return TEMPLATES.get(name ?? "default") ?? defaultTemplate;
}

export function listTemplates(): ReadmeTemplate[] {
  return [...TEMPLATES.values()];
}

export { TEMPLATES };
