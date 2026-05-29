import { AIError } from "./errors.js";
import { createProviderAdapter } from "./providers/index.js";
import type {
  AIMiddleware,
  AIProvider,
  AIProviderAdapter,
  AIProviderConfig,
  RateLimitOptions,
  RetryOptions,
} from "./types.js";

// ── Registry ──────────────────────────────────────────────────────────────────

class AIProviderRegistry {
  private readonly adapters = new Map<AIProvider, AIProviderAdapter>();

  /**
   * Register a provider adapter.
   * Call at startup or before the first command that needs AI.
   */
  register(adapter: AIProviderAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  /** Look up a registered adapter by name. */
  get(provider: AIProvider): AIProviderAdapter | undefined {
    return this.adapters.get(provider);
  }

  /**
   * Resolve a provider by name, throwing a descriptive error when missing
   * or not configured. Use this in command actions.
   */
  resolve(provider: AIProvider): AIProviderAdapter {
    const adapter = this.adapters.get(provider);
    if (adapter === undefined) {
      throw new AIError(
        `AI provider "${provider}" is not registered. ` +
          `Available: ${this.listAvailable().join(", ") || "none"}.`,
        "not_configured", provider, false,
      );
    }
    if (!adapter.isConfigured()) {
      throw new AIError(
        `AI provider "${provider}" is registered but not configured — check its API key.`,
        "not_configured", provider, false,
      );
    }
    return adapter;
  }

  /** All registered provider names (configured or not). */
  list(): AIProvider[] {
    return [...this.adapters.keys()];
  }

  /** Registered AND configured provider names. */
  listAvailable(): AIProvider[] {
    return [...this.adapters.entries()]
      .filter(([, a]) => a.isConfigured())
      .map(([name]) => name);
  }

  /** True when at least one configured provider is available. */
  hasAny(): boolean {
    return this.listAvailable().length > 0;
  }
}

export const aiRegistry = new AIProviderRegistry();

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a fully wired adapter from a provider config.
 * Optionally wraps it with retry, rate-limiting, and/or additional middleware.
 *
 * Middleware is applied in this fixed order (outermost → innermost):
 *   custom → logging (if any) → retry → rateLimit → provider
 *
 * @example
 * const adapter = createAdapter(
 *   { provider: "anthropic" },
 *   { retry: { maxAttempts: 3 }, rateLimit: { requestsPerMinute: 60 } },
 * );
 */
export async function createAdapter(
  config: AIProviderConfig,
  opts: {
    retry?:       RetryOptions;
    rateLimit?:   RateLimitOptions;
    middleware?:  AIMiddleware[];
  } = {},
): Promise<AIProviderAdapter> {
  const { compose, withRetry, withRateLimit } = await import("./middleware/index.js");

  const layers: AIMiddleware[] = [];

  // Extra middleware (outermost — added last so they wrap everything below)
  if (opts.middleware !== undefined) layers.push(...opts.middleware);

  // Retry sits outside rate-limit so each retry attempt passes through rate-limit
  if (opts.retry !== undefined)     layers.push(withRetry(opts.retry));
  if (opts.rateLimit !== undefined) layers.push(withRateLimit(opts.rateLimit));

  const base = createProviderAdapter(config);
  return layers.length > 0 ? compose(...layers)(base) : base;
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { AIError } from "./errors.js";
export type { AIErrorCode } from "./errors.js";

export {
  AnthropicAdapter,
  OpenAIAdapter,
  OllamaAdapter,
  createProviderAdapter,
} from "./providers/index.js";

export {
  compose,
  withFallback,
  withLogging,
  withRateLimit,
  withRetry,
  FallbackAdapter,
} from "./middleware/index.js";

export type { LoggingOptions } from "./middleware/index.js";

export { buildGenerateRequest, buildExplainRequest } from "./prompts/index.js";

export type {
  AIMiddleware,
  AIProvider,
  AIProviderAdapter,
  AIProviderConfig,
  AIResponse,
  AIUsage,
  ChatMessage,
  ChatRequest,
  ExplainRequest,
  FallbackOptions,
  GenerateRequest,
  MessageRole,
  RateLimitOptions,
  RetryOptions,
  StreamChunk,
} from "./types.js";
