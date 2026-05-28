import type { ContributingContext, RenderedSection, SectionRenderer } from "../types.js";

export const codingStandardsSection: SectionRenderer = {
  id: "coding-standards",

  render(ctx: ContributingContext): RenderedSection | null {
    const {
      hasLinting,
      hasFormatting,
      hasTypeCheck,
      hasTests,
      hasGitHooks,
      lintCmd,
      formatCmd,
      typeCheckCmd,
      testCmd,
    } = ctx;

    if (!hasLinting && !hasFormatting && !hasTypeCheck && !hasTests) return null;

    const lines: string[] = [];
    lines.push("## Coding Standards");
    lines.push("");
    lines.push(
      "All contributions must satisfy these quality gates before merging.",
    );
    lines.push("");

    if (hasTypeCheck) {
      lines.push("### TypeScript");
      lines.push("");
      lines.push(
        "The codebase is fully typed. Contributions must be type-safe — avoid `any` unless the case is explicitly documented.",
      );
      if (typeCheckCmd) {
        lines.push("");
        lines.push("```bash");
        lines.push(typeCheckCmd);
        lines.push("```");
      }
      lines.push("");
    }

    if (hasLinting) {
      lines.push("### Linting");
      lines.push("");
      lines.push("Code must pass the linter with zero errors or warnings.");
      if (lintCmd) {
        lines.push("");
        lines.push("```bash");
        lines.push(lintCmd);
        lines.push("```");
      }
      lines.push("");
    }

    if (hasFormatting) {
      lines.push("### Formatting");
      lines.push("");
      lines.push(
        "All files must be formatted before committing. Do not adjust whitespace or style manually.",
      );
      if (formatCmd) {
        lines.push("");
        lines.push("```bash");
        lines.push(formatCmd);
        lines.push("```");
      }
      lines.push("");
    }

    if (hasTests) {
      lines.push("### Tests");
      lines.push("");
      lines.push(
        "New features and bug fixes must be accompanied by tests. All pre-existing tests must continue to pass.",
      );
      if (testCmd) {
        lines.push("");
        lines.push("```bash");
        lines.push(testCmd);
        lines.push("```");
      }
      lines.push("");
    }

    if (hasGitHooks) {
      lines.push("### Git Hooks");
      lines.push("");
      lines.push(
        "Pre-commit hooks run automatically on every commit. If a hook fails, fix the reported issues before retrying.",
      );
      lines.push("");
    }

    lines.push("### General Principles");
    lines.push("");
    lines.push("- Prefer clarity over cleverness.");
    lines.push("- Keep functions small and single-purpose.");
    lines.push("- Avoid unnecessary abstractions and dependencies.");
    lines.push("- Code is read far more often than it is written — optimise for the reader.");

    return {
      id: "coding-standards",
      title: "Coding Standards",
      content: lines.join("\n"),
    };
  },
};
