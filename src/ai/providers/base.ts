import { buildExplainRequest } from "../prompts/explain.js";
import { buildGenerateRequest } from "../prompts/generate.js";
import type {
  AIProvider,
  AIProviderAdapter,
  AIProviderConfig,
  AIResponse,
  ChatRequest,
  ExplainRequest,
  GenerateRequest,
  StreamChunk,
} from "../types.js";

/**
 * Abstract base — concrete adapters implement `chat()` and `stream()` only.
 * `generate` and `explain` are auto-wired via prompt builders.
 */
export abstract class BaseAdapter implements AIProviderAdapter {
  abstract readonly name: AIProvider;
  abstract readonly supportedModels: readonly string[];

  protected readonly config: AIProviderConfig & {
    timeout: number;
    temperature: number;
    maxTokens: number;
  };

  constructor(config: AIProviderConfig) {
    this.config = {
      timeout:     30_000,
      temperature: 0.3,
      maxTokens:   4_096,
      ...config,
    };
  }

  abstract isConfigured(): boolean;
  abstract chat(req: ChatRequest): Promise<AIResponse>;
  abstract stream(req: ChatRequest): AsyncGenerator<StreamChunk>;

  async generate(req: GenerateRequest): Promise<AIResponse> {
    return this.chat(buildGenerateRequest(req));
  }

  async explain(req: ExplainRequest): Promise<AIResponse> {
    return this.chat(buildExplainRequest(req));
  }

  /** Merge per-request overrides with adapter-level defaults. */
  protected mergeDefaults(req: ChatRequest): Required<Pick<ChatRequest, "maxTokens" | "temperature">> {
    return {
      maxTokens:   req.maxTokens   ?? this.config.maxTokens,
      temperature: req.temperature ?? this.config.temperature,
    };
  }

  /** Build an AbortSignal that fires after the configured timeout. */
  protected timeoutSignal(): AbortSignal {
    return AbortSignal.timeout(this.config.timeout);
  }
}
