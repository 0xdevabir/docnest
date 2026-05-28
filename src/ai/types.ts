// ── Provider registry types ────────────────────────────────────────────────────

export type AIProvider = "openai" | "anthropic" | "ollama" | "custom";

export interface AIProviderConfig {
  provider: AIProvider;
  /** Model identifier, e.g. "gpt-4o", "claude-sonnet-4-6", "llama3.2" */
  model?: string;
  apiKey?: string;
  /** Override the provider's default base URL (useful for proxies / ollama). */
  baseUrl?: string;
  /** Request timeout in milliseconds. */
  timeout?: number;
}

// ── Request shapes ─────────────────────────────────────────────────────────────

export interface GenerateRequest {
  /** Source content to generate documentation from. */
  source: string;
  /** Additional context passed to the model. */
  context?: string;
  /** Named output template (e.g. "api-reference", "readme", "changelog"). */
  template?: string;
  /** Desired output format. */
  format?: "markdown" | "mdx" | "html" | "plain";
  /** Free-form instructions appended to the system prompt. */
  instructions?: string;
  /** Token budget hint — provider may ignore this. */
  maxTokens?: number;
}

export interface ExplainRequest {
  /** Absolute path of the file being explained (for context). */
  filePath: string;
  /** Full content of the file. */
  content: string;
  /** How thorough the explanation should be. */
  depth?: "brief" | "standard" | "detailed";
  /** Desired output format. */
  format?: "text" | "markdown";
  /** Narrow the explanation to a specific aspect (e.g. "authentication flow"). */
  focus?: string;
}

// ── Response ───────────────────────────────────────────────────────────────────

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: AIUsage;
  finishReason?: "stop" | "length" | "error";
}

// ── Adapter contract ───────────────────────────────────────────────────────────

/**
 * Each AI provider integration must implement this interface.
 *
 * Register adapters via `aiRegistry.register(adapter)` at startup.
 * Commands resolve a provider through `aiRegistry.resolve(name)`.
 */
export interface AIProviderAdapter {
  readonly name: AIProvider;
  /** Human-readable list of model IDs supported by this adapter. */
  readonly supportedModels: readonly string[];
  /** Returns true when the adapter has the credentials it needs to call. */
  isConfigured(): boolean;
  generate(request: GenerateRequest): Promise<AIResponse>;
  explain(request: ExplainRequest): Promise<AIResponse>;
}
