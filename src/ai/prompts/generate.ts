import type { ChatRequest, GenerateRequest } from "../types.js";

const SYSTEM = `You are a senior technical writer specialising in developer documentation. \
Generate accurate, concise documentation for the provided source code. \
Write for developers. Follow the requested format exactly.`;

export function buildGenerateRequest(req: GenerateRequest): ChatRequest {
  const formatLabel = req.format ?? "markdown";
  const templateLabel = req.template !== undefined ? ` (${req.template} template)` : "";

  const parts: string[] = [
    `Generate ${formatLabel} documentation${templateLabel} for the following source code.`,
  ];

  if (req.instructions !== undefined && req.instructions.trim().length > 0) {
    parts.push(`Additional instructions: ${req.instructions}`);
  }

  parts.push("", "```", req.source, "```");

  if (req.context !== undefined && req.context.trim().length > 0) {
    parts.push("", `Context: ${req.context}`);
  }

  return {
    system: SYSTEM,
    messages: [{ role: "user", content: parts.join("\n") }],
    ...(req.maxTokens !== undefined && { maxTokens: req.maxTokens }),
    ...(req.temperature !== undefined && { temperature: req.temperature }),
  };
}
