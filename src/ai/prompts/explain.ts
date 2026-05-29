import path from "node:path";
import type { ChatRequest, ExplainRequest } from "../types.js";

const SYSTEM = `You are a senior software engineer. \
Explain code accurately and concisely for other developers. \
Focus on what the code does, why it matters, and any non-obvious design decisions.`;

const DEPTH_PREFIX: Record<NonNullable<ExplainRequest["depth"]>, string> = {
  brief:    "In 2–3 sentences, explain",
  standard: "Explain",
  detailed: "Explain in detail — cover purpose, key logic, edge cases, and design decisions for",
};

export function buildExplainRequest(req: ExplainRequest): ChatRequest {
  const depth = req.depth ?? "standard";
  const prefix = DEPTH_PREFIX[depth];
  const ext = path.extname(req.filePath).slice(1) || "ts";
  const relPath = path.basename(req.filePath);

  const focusClause =
    req.focus !== undefined && req.focus.trim().length > 0
      ? ` Focus specifically on: ${req.focus}.`
      : "";

  const formatNote =
    req.format === "markdown" ? " Respond in Markdown." : "";

  const header = `${prefix} this file: \`${relPath}\`.${focusClause}${formatNote}`;

  const content = [
    header,
    "",
    `\`\`\`${ext}`,
    req.content,
    "```",
  ].join("\n");

  return {
    system: SYSTEM,
    messages: [{ role: "user", content }],
    ...(req.temperature !== undefined && { temperature: req.temperature }),
  };
}
