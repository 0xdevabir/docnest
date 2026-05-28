import type { ContributingContext, RenderedSection, SectionRenderer } from "../types.js";

const CONVENTIONAL_TYPES: [string, string][] = [
  ["feat", "A new feature"],
  ["fix", "A bug fix"],
  ["docs", "Documentation changes only"],
  ["style", "Whitespace, formatting — no logic change"],
  ["refactor", "Code change that is neither a fix nor a feature"],
  ["test", "Adding or correcting tests"],
  ["chore", "Build process, tooling, or dependency updates"],
  ["perf", "Performance improvement"],
];

export const workflowSection: SectionRenderer = {
  id: "workflow",

  render(ctx: ContributingContext): RenderedSection | null {
    const { mainBranch, commitConvention } = ctx;

    const lines: string[] = [];
    lines.push("## Development Workflow");
    lines.push("");

    lines.push("### Branching");
    lines.push("");
    lines.push(
      `Always branch off \`${mainBranch}\`. Keep your branch up to date by rebasing frequently.`,
    );
    lines.push("");
    lines.push("```bash");
    lines.push(`git checkout ${mainBranch}`);
    lines.push(`git pull upstream ${mainBranch}`);
    lines.push("git checkout -b <type>/<short-description>");
    lines.push("```");
    lines.push("");
    lines.push("**Branch naming:**");
    lines.push("");
    lines.push("| Prefix | Use for |");
    lines.push("| --- | --- |");
    lines.push("| `feat/` | New features |");
    lines.push("| `fix/` | Bug fixes |");
    lines.push("| `docs/` | Documentation |");
    lines.push("| `refactor/` | Refactoring |");
    lines.push("| `chore/` | Tooling, dependencies |");
    lines.push("");

    lines.push("### Commit Messages");
    lines.push("");

    if (commitConvention === "conventional") {
      lines.push(
        "This project enforces **[Conventional Commits](https://www.conventionalcommits.org)**:",
      );
      lines.push("");
      lines.push("```");
      lines.push("<type>(<scope>): <short summary>");
      lines.push("");
      lines.push("[optional body]");
      lines.push("");
      lines.push("[optional footer — e.g. Closes #123, BREAKING CHANGE: ...]");
      lines.push("```");
      lines.push("");
      lines.push("| Type | When to use |");
      lines.push("| --- | --- |");
      for (const [type, desc] of CONVENTIONAL_TYPES) {
        lines.push(`| \`${type}\` | ${desc} |`);
      }
      lines.push("");
      lines.push("**Examples:**");
      lines.push("```");
      lines.push("feat(auth): add OAuth2 login");
      lines.push("fix(api): handle null response from upstream");
      lines.push("docs: update contributing guide");
      lines.push("chore(deps): bump typescript to 5.5");
      lines.push("```");
    } else {
      lines.push(
        "Write clear, imperative commit messages that explain the **why**:",
      );
      lines.push("");
      lines.push('- Use imperative mood — _"Add feature"_ not _"Added feature"_');
      lines.push("- Keep the subject line under 72 characters");
      lines.push("- Reference issues where relevant: `Closes #123`");
      lines.push("");
      lines.push("**Examples:**");
      lines.push("```");
      lines.push("Add rate limiting to public API endpoints");
      lines.push("Fix null pointer when user has no profile image");
      lines.push("Refactor auth middleware to reduce duplication");
      lines.push("```");
    }

    lines.push("");
    lines.push("### Staying in Sync");
    lines.push("");
    lines.push("Rebase onto upstream before opening a PR:");
    lines.push("");
    lines.push("```bash");
    lines.push("git fetch upstream");
    lines.push(`git rebase upstream/${mainBranch}`);
    lines.push("```");

    return { id: "workflow", title: "Development Workflow", content: lines.join("\n") };
  },
};
