import type { ContributingTemplate } from "../types.js";

const defaultTemplate: ContributingTemplate = {
  name: "default",
  desc: "Full CONTRIBUTING.md for an open-source project",
  sections: [
    "intro",
    "setup",
    "workflow",
    "pr-guidelines",
    "coding-standards",
    "repo-structure",
  ],
};

const minimalTemplate: ContributingTemplate = {
  name: "minimal",
  desc: "Concise CONTRIBUTING.md with just the essentials",
  sections: ["intro", "setup", "pr-guidelines"],
};

const libraryTemplate: ContributingTemplate = {
  name: "library",
  desc: "CONTRIBUTING.md optimised for published libraries",
  sections: [
    "intro",
    "setup",
    "workflow",
    "pr-guidelines",
    "coding-standards",
  ],
  exclude: ["repo-structure"],
};

const appTemplate: ContributingTemplate = {
  name: "app",
  desc: "CONTRIBUTING.md for web applications with full repo orientation",
  sections: [
    "intro",
    "repo-structure",
    "setup",
    "workflow",
    "pr-guidelines",
    "coding-standards",
  ],
};

const TEMPLATES = new Map<string, ContributingTemplate>([
  ["default", defaultTemplate],
  ["minimal", minimalTemplate],
  ["library", libraryTemplate],
  ["app", appTemplate],
]);

export function getTemplate(name?: string): ContributingTemplate {
  return TEMPLATES.get(name ?? "default") ?? defaultTemplate;
}

export function listTemplates(): ContributingTemplate[] {
  return [...TEMPLATES.values()];
}

export { TEMPLATES };
