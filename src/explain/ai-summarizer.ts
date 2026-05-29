import type { AIProviderAdapter } from "../ai/types.js";
import type { ExplainDepth, ExplainSectionId } from "./types.js";

/**
 * Grounding rules sent as the system prompt.
 * The AI is explicitly forbidden from inventing anything — it can only
 * restate and reformulate what the analysis data already contains.
 */
const SYSTEM = `\
You are a software documentation assistant that explains codebases to developers.

STRICT RULES — violating any rule makes the response useless:
1. Only reference information EXPLICITLY present in the provided analysis data.
2. Never invent file paths, library names, class names, or features not stated in the data.
3. If the data is sparse or inconclusive, say so briefly — do not fill gaps with assumptions.
4. Write for experienced developers: precise, no filler phrases, no corporate speak.
5. Respond in Markdown. Use inline code for file paths and identifiers.`;

const DEPTH_GUIDE: Record<ExplainDepth, string> = {
  brief:    "Write exactly 2-3 concise sentences.",
  standard: "Write 3-5 sentences.",
  detailed: "Write 1-2 focused paragraphs (each 3-5 sentences).",
};

const SECTION_PROMPT: Record<ExplainSectionId, string> = {
  "purpose":        "what this repository is, what it does, and who it is for",
  "architecture":   "the architectural structure, patterns, and how the codebase is organized",
  "modules":        "the most important and widely-used modules and their roles in the system",
  "auth":           "how authentication and authorization are implemented",
  "api":            "the API design — frameworks, styles, endpoints, and structure",
  "business-logic": "where business logic lives, what domains exist, and how they are structured",
};

export interface SummarizeResult {
  content: string;
  model: string;
  provider: string;
}

/**
 * Call the AI adapter to write a readable explanation of one section.
 * The facts string is the ONLY source of truth passed to the model.
 */
export async function aiSummarize(
  adapter: AIProviderAdapter,
  sectionId: ExplainSectionId,
  sectionTitle: string,
  facts: string,
  depth: ExplainDepth,
  projectName: string,
): Promise<SummarizeResult> {
  const depthGuide = DEPTH_GUIDE[depth];
  const sectionFocus = SECTION_PROMPT[sectionId];

  const response = await adapter.chat({
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Project: **${projectName}**`,
          `Section: **${sectionTitle}**`,
          "",
          `Task: ${depthGuide} Explain ${sectionFocus}.`,
          "Base your explanation ONLY on the analysis data below.",
          "",
          "---",
          facts,
          "---",
        ].join("\n"),
      },
    ],
    temperature: 0.15,
    maxTokens: depth === "brief" ? 160 : depth === "standard" ? 320 : 700,
  });

  return {
    content: response.content.trim(),
    model:    response.model,
    provider: adapter.name,
  };
}
