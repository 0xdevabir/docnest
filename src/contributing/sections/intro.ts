import type { ContributingContext, RenderedSection, SectionRenderer } from "../types.js";

export const introSection: SectionRenderer = {
  id: "intro",

  render(ctx: ContributingContext): RenderedSection | null {
    const { projectName, projectDescription, repo, license, hasChangelog } = ctx;

    const lines: string[] = [];
    lines.push(`# Contributing to ${projectName}`);
    lines.push("");
    lines.push(
      `Thank you for considering contributing to **${projectName}**! This document covers how to get started, our development workflow, and the standards we hold contributions to.`,
    );
    lines.push("");

    if (projectDescription) {
      lines.push(`> ${projectDescription}`);
      lines.push("");
    }

    const links: string[] = [];
    if (repo) links.push(`- [Repository](${repo})`);
    if (hasChangelog) links.push("- [Changelog](./CHANGELOG.md)");
    if (license) links.push(`- License: **${license}**`);

    if (links.length > 0) {
      lines.push(...links);
      lines.push("");
    }

    lines.push(
      "> **Note:** By contributing you agree that your work will be licensed under this project's license.",
    );

    return {
      id: "intro",
      title: `Contributing to ${projectName}`,
      content: lines.join("\n"),
    };
  },
};
