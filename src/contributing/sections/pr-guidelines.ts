import type { ContributingContext, RenderedSection, SectionRenderer } from "../types.js";

export const prGuidelinesSection: SectionRenderer = {
  id: "pr-guidelines",

  render(ctx: ContributingContext): RenderedSection | null {
    const { hasTests, hasCi, hasLinting, hasTypeCheck } = ctx;

    const lines: string[] = [];
    lines.push("## Pull Request Guidelines");
    lines.push("");

    lines.push("### Before You Submit");
    lines.push("");
    lines.push("Ensure your PR meets all of the following:");
    lines.push("");

    const checklist: string[] = [
      `Branch is up to date with \`${ctx.mainBranch}\``,
      "Code follows the project's style and standards",
    ];
    if (hasTests) checklist.push("All existing tests pass locally");
    if (hasTests) checklist.push("New behaviour is covered by tests");
    if (hasLinting) checklist.push("No linting errors");
    if (hasTypeCheck) checklist.push("No TypeScript type errors");
    checklist.push("Commits are clean and descriptive");
    checklist.push("PR description explains what changed and why");
    if (hasCi) checklist.push("All CI checks pass");

    for (const item of checklist) {
      lines.push(`- [ ] ${item}`);
    }
    lines.push("");

    lines.push("### PR Description Template");
    lines.push("");
    lines.push("A well-written PR description accelerates review. Aim to answer:");
    lines.push("");
    lines.push("- **What** does this change?");
    lines.push("- **Why** is it needed?");
    lines.push("- **How** was it tested?");
    lines.push("- Any **breaking changes** or **migration steps**?");
    lines.push("");

    lines.push("### Scope");
    lines.push("");
    lines.push(
      "Keep PRs focused on **one concern** — one feature, one fix, one refactor.",
    );
    lines.push("Large or structural changes should start as an issue or discussion.");
    lines.push("");

    lines.push("### Review Process");
    lines.push("");
    lines.push("1. A maintainer will review your PR within a reasonable timeframe.");
    lines.push(
      "2. Address feedback by pushing additional commits — avoid force-pushing after review starts.",
    );
    lines.push("3. Once approved, a maintainer will squash-merge or merge your PR.");

    return {
      id: "pr-guidelines",
      title: "Pull Request Guidelines",
      content: lines.join("\n"),
    };
  },
};
