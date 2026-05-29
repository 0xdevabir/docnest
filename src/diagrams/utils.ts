/** Sanitise a string into a valid Mermaid node identifier. */
export function mId(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, "_").replace(/^(\d)/, "N$1");
}

/** Wrap a Mermaid string in a fenced code block for Markdown embedding. */
export function mermaidFence(code: string): string {
  return "```mermaid\n" + code + "\n```";
}
