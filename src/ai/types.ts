// ── Provider identity ─────────────────────────────────────────────────────────

export type AIProvider = "openai" | "anthropic" | "ollama" | "custom";

export interface AIProviderConfig {
  provider: AIProvider;
  /** Model id, e.g. "gpt-4o", "claude-sonnet-4-6", "llama3.2" */
  model?: string;
  apiKey?: string;
  /** Override the provider's default base URL (proxies / local inference). */
  baseUrl?: string;
  /** Request timeout in milliseconds. Default: 30 000. */
  timeout?: number;
  /** Default sampling temperature. Default: 0.3. */
  temperature?: number;
  /** Default max tokens per response. Default: 4096. */
  maxTokens?: number;
}

// ── Chat primitives ───────────────────────────────────────────────────────────

export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** Provider-level system prompt (preferred over a system ChatMessage). */
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// ── Streaming ─────────────────────────────────────────────────────────────────

export type StreamChunk =
  | { delta: string; done: false }
  | { delta: ""; done: true; usage?: AIUsage; finishReason?: "stop" | "length" | "error" };

// ── Domain request shapes ─────────────────────────────────────────────────────

export interface GenerateRequest {
  /** Source content to generate documentation from. */
  source: string;
  /** Additional context passed to the model. */
  context?: string;
  /** Named output template (e.g. "api-reference", "readme", "changelog"). */
  template?: string;
  format?: "markdown" | "mdx" | "html" | "plain";
  /** Free-form instructions appended to the system prompt. */
  instructions?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ExplainRequest {
  /** Absolute path of the file being explained (for context). */
  filePath: string;
  content: string;
  depth?: "brief" | "standard" | "detailed";
  format?: "text" | "markdown";
  /** Narrow the explanation to a specific aspect (e.g. "authentication flow"). */
  focus?: string;
  temperature?: number;
}

// ── Response ──────────────────────────────────────────────────────────────────

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

// ── Adapter interface ─────────────────────────────────────────────────────────

export interface AIProviderAdapter {
  readonly name: AIProvider;
  readonly supportedModels: readonly string[];
  isConfigured(): boolean;
  /** Core primitive. All other methods delegate here. */
  chat(req: ChatRequest): Promise<AIResponse>;
  /** Streaming variant — yields text deltas then a final done chunk. */
  stream(req: ChatRequest): AsyncGenerator<StreamChunk>;
  generate(req: GenerateRequest): Promise<AIResponse>;
  explain(req: ExplainRequest): Promise<AIResponse>;
}

// ── Middleware ────────────────────────────────────────────────────────────────

/** Wraps one adapter with cross-cutting behaviour and returns a new adapter. */
export type AIMiddleware = (adapter: AIProviderAdapter) => AIProviderAdapter;

export interface RetryOptions {
  /** Maximum attempts (including the first). Default: 3. */
  maxAttempts?: number;
  /** Initial backoff in ms. Default: 500. */
  baseDelayMs?: number;
  /** Backoff ceiling in ms. Default: 30 000. */
  maxDelayMs?: number;
  /** Jitter fraction [0, 1] added to each delay. Default: 0.25. */
  jitter?: number;
}

export interface RateLimitOptions {
  /** Max requests per minute. Default: 60. */
  requestsPerMinute?: number;
  /** Max concurrent in-flight requests. Default: 5. */
  maxConcurrent?: number;
}

export interface FallbackOptions {
  /** Called when a provider fails and the next one is tried. */
  onFallback?: (
    failed: AIProvider,
    next: AIProvider | "exhausted",
    error: Error,
  ) => void;
}
