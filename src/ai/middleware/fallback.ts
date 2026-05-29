import { AIError } from "../errors.js";
import type {
  AIProvider,
  AIProviderAdapter,
  AIResponse,
  ChatRequest,
  ExplainRequest,
  FallbackOptions,
  GenerateRequest,
  StreamChunk,
} from "../types.js";

/**
 * Tries each adapter in order, returning the first success.
 * A non-retryable error (auth, quota) bypasses fallback for that provider
 * but still attempts the next. Retryable errors always fall through.
 *
 * For streaming, fallback only activates if the stream fails before yielding.
 */
export class FallbackAdapter implements AIProviderAdapter {
  readonly name: AIProvider;
  readonly supportedModels: readonly string[];

  constructor(
    private readonly adapters: readonly AIProviderAdapter[],
    private readonly options: FallbackOptions = {},
  ) {
    if (adapters.length === 0) throw new Error("FallbackAdapter requires at least one adapter");
    this.name = adapters[0]!.name;
    this.supportedModels = adapters.flatMap((a) => [...a.supportedModels]);
  }

  isConfigured(): boolean {
    return this.adapters.some((a) => a.isConfigured());
  }

  async chat(req: ChatRequest): Promise<AIResponse> {
    return this.tryEach((a) => a.chat(req));
  }

  async generate(req: GenerateRequest): Promise<AIResponse> {
    return this.tryEach((a) => a.generate(req));
  }

  async explain(req: ExplainRequest): Promise<AIResponse> {
    return this.tryEach((a) => a.explain(req));
  }

  async *stream(req: ChatRequest): AsyncGenerator<StreamChunk> {
    let lastErr: unknown;

    for (let i = 0; i < this.adapters.length; i++) {
      const adapter = this.adapters[i]!;
      let started = false;

      try {
        for await (const chunk of adapter.stream(req)) {
          started = true;
          yield chunk;
        }
        return;
      } catch (err) {
        lastErr = err;
        if (started) throw err; // partial stream — can't resume with another provider

        const next = this.adapters[i + 1];
        this.options.onFallback?.(
          adapter.name,
          next?.name ?? "exhausted",
          err instanceof Error ? err : new Error(String(err)),
        );
      }
    }

    throw lastErr ?? new AIError("All providers failed", "all_providers_failed", "fallback", false);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private async tryEach<T>(fn: (adapter: AIProviderAdapter) => Promise<T>): Promise<T> {
    let lastErr: unknown;

    for (let i = 0; i < this.adapters.length; i++) {
      const adapter = this.adapters[i]!;
      try {
        return await fn(adapter);
      } catch (err) {
        lastErr = err;
        const next = this.adapters[i + 1];
        this.options.onFallback?.(
          adapter.name,
          next?.name ?? "exhausted",
          err instanceof Error ? err : new Error(String(err)),
        );
      }
    }

    throw lastErr ?? new AIError("All providers failed", "all_providers_failed", "fallback", false);
  }
}

/**
 * Convenience function: wrap multiple adapters in a single fallback chain.
 *
 * @example
 * const adapter = withFallback(
 *   [new AnthropicAdapter(), new OpenAIAdapter()],
 *   { onFallback: (failed, next) => logger.warn(`${failed} failed, trying ${next}`) }
 * );
 */
export function withFallback(
  adapters: readonly AIProviderAdapter[],
  options?: FallbackOptions,
): FallbackAdapter {
  return new FallbackAdapter(adapters, options);
}
