import chalk from "chalk";
import ora from "ora";
import type { Ora } from "ora";

// ── Color palette ──────────────────────────────────────────────────────────────

export const colors = {
  primary:   chalk.hex("#7C3AED"),  // violet  — brand
  accent:    chalk.hex("#06B6D4"),  // cyan    — accent / info
  success:   chalk.hex("#10B981"),  // emerald — success
  warning:   chalk.hex("#F59E0B"),  // amber   — warning
  error:     chalk.hex("#EF4444"),  // red     — error
  muted:     chalk.hex("#6B7280"),  // gray    — secondary text
  path:      chalk.cyan,
  code:      chalk.hex("#A78BFA"),  // light violet — commands/code
  highlight: chalk.white.bold,
  dim:       chalk.dim,
  bold:      chalk.bold,
} as const;

// ── Symbol set ─────────────────────────────────────────────────────────────────

export const sym = {
  success: colors.success("✔"),
  error:   colors.error("✘"),
  warning: colors.warning("⚠"),
  info:    colors.accent("ℹ"),
  arrow:   colors.muted("→"),
  bullet:  colors.primary("◆"),
  dot:     colors.muted("·"),
  pointer: colors.primary("❯"),
  tick:    colors.success("✓"),
  cross:   colors.error("✕"),
  sparkle: colors.primary("✦"),
} as const;

// ── Spinner factory ────────────────────────────────────────────────────────────

const BRAILLE_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function createSpinner(text: string): Ora {
  return ora({
    text,
    spinner: { interval: 80, frames: BRAILLE_FRAMES },
    color: "cyan",
  });
}

// ── Banner ─────────────────────────────────────────────────────────────────────

const WORDMARK = [
  "   ██████╗  ██████╗  ██████╗███████╗███╗   ███╗██╗████████╗██╗  ██╗",
  "   ██╔══██╗██╔═══██╗██╔════╝██╔════╝████╗ ████║██║╚══██╔══╝██║  ██║",
  "   ██║  ██║██║   ██║██║     ███████╗██╔████╔██║██║   ██║   ███████║",
  "   ██║  ██║██║   ██║██║     ╚════██║██║╚██╔╝██║██║   ██║   ██╔══██║",
  "   ██████╔╝╚██████╔╝╚██████╗███████║██║ ╚═╝ ██║██║   ██║   ██║  ██║",
  "   ╚═════╝  ╚═════╝  ╚═════╝╚══════╝╚═╝     ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝",
];

export function printBanner(tagline?: string): void {
  console.log("");
  for (const line of WORDMARK) {
    console.log(colors.primary(line));
  }
  if (tagline !== undefined) {
    console.log(`\n   ${colors.muted(tagline)}`);
  }
  console.log("");
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

export function divider(width = 64): void {
  console.log(`  ${colors.muted("─".repeat(width))}`);
}

export function section(title: string): void {
  console.log("");
  console.log(`  ${colors.primary.bold(title)}`);
  console.log(`  ${colors.muted("─".repeat(title.length))}`);
}

export function step(n: number, label: string, hint?: string): void {
  const prefix = colors.muted(`${n}.`);
  const suffix = hint !== undefined ? `  ${colors.muted(hint)}` : "";
  console.log(`  ${prefix} ${label}${suffix}`);
}

export function blank(): void {
  console.log("");
}

// ── Print helpers ──────────────────────────────────────────────────────────────

export function printSuccess(message: string): void {
  console.log(`  ${sym.success}  ${message}`);
}

export function printError(message: string): void {
  console.error(`  ${sym.error}  ${colors.error(message)}`);
}

export function printWarning(message: string): void {
  console.warn(`  ${sym.warning}  ${colors.warning(message)}`);
}

export function printInfo(message: string): void {
  console.log(`  ${sym.info}  ${message}`);
}

export function printItem(label: string, value?: string): void {
  if (value !== undefined) {
    console.log(`  ${sym.bullet}  ${colors.muted(label)}  ${value}`);
  } else {
    console.log(`  ${sym.bullet}  ${label}`);
  }
}

// ── Format helpers ─────────────────────────────────────────────────────────────

export function formatPath(p: string): string {
  return colors.path(p);
}

export function formatCmd(cmd: string): string {
  return colors.code(cmd);
}

export function formatKey(key: string, value: string, pad = 18): string {
  return `  ${colors.muted(key.padEnd(pad))}  ${value}`;
}

export function formatTag(label: string): string {
  return colors.primary.bold(`[${label}]`);
}

// ── Box renderer ───────────────────────────────────────────────────────────────

export function printBox(lines: string[], title?: string): void {
  const stripped = lines.map(stripAnsi);
  const maxRaw = Math.max(
    ...stripped.map((s) => s.length),
    title !== undefined ? title.length + 2 : 0,
  );
  const innerWidth = maxRaw + 4;

  if (title !== undefined) {
    const titlePad = `  ${chalk.bold(title)}  `;
    const titleRaw = `  ${title}  `;
    const fill = "─".repeat(Math.max(0, innerWidth - titleRaw.length));
    console.log(colors.muted("╭─") + titlePad + colors.muted(fill + "╮"));
  } else {
    console.log(colors.muted("╭" + "─".repeat(innerWidth + 2) + "╮"));
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const raw = stripped[i] ?? "";
    const pad = " ".repeat(Math.max(0, maxRaw - raw.length));
    console.log(`${colors.muted("│")}  ${line}${pad}  ${colors.muted("│")}`);
  }

  console.log(colors.muted("╰" + "─".repeat(innerWidth + 2) + "╯"));
}

// ── Minimal ANSI strip (length calc only — no runtime dep) ────────────────────

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*m/g, "");
}
