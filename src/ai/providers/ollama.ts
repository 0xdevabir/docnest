import type { AIProvider, AIProviderConfig } from "../types.js";
import { OpenAIAdapter } from "./openai.js";

const OLLAMA_BASE = "http://localhost:11434/v1";
const DEFAULT_MODEL = "llama3.2";

/**
 * Ollama adapter — reuses the OpenAI-compatible `/v1/chat/completions` endpoint
 * that Ollama exposes when running `ollama serve`.
 * No API key required for local deployments.
 */
export class OllamaAdapter extends OpenAIAdapter {
  override readonly name: AIProvider = "ollama";
  override readonly supportedModels: readonly string[] = [
    "llama3.2",
    "llama3.1",
    "mistral",
    "codellama",
    "phi3",
    "gemma2",
    "qwen2.5-coder",
  ];

  constructor(config: Partial<AIProviderConfig> = {}) {
    super({
      provider: "ollama",
      model:    DEFAULT_MODEL,
      baseUrl:  OLLAMA_BASE,
      apiKey:   "ollama", // Ollama accepts any non-empty key
      ...config,
    });
  }

  /** Ollama never needs a remote API key — it is always "configured". */
  override isConfigured(): boolean {
    return true;
  }
}
