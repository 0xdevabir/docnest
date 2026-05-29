export { AnthropicAdapter } from "./anthropic.js";
export { OpenAIAdapter } from "./openai.js";
export { OllamaAdapter } from "./ollama.js";

import type { AIProvider, AIProviderAdapter, AIProviderConfig } from "../types.js";
import { AnthropicAdapter } from "./anthropic.js";
import { OllamaAdapter } from "./ollama.js";
import { OpenAIAdapter } from "./openai.js";

/**
 * Instantiate the correct adapter for a given provider config.
 * Throws if `config.provider` is unrecognised.
 */
export function createProviderAdapter(config: AIProviderConfig): AIProviderAdapter {
  switch (config.provider as AIProvider) {
    case "anthropic": return new AnthropicAdapter(config);
    case "openai":    return new OpenAIAdapter(config);
    case "ollama":    return new OllamaAdapter(config);
    case "custom":
      throw new Error(
        'Provider "custom" requires you to pass an adapter instance directly — ' +
        "use aiRegistry.register(yourAdapter).",
      );
    default:
      throw new Error(`Unknown AI provider: "${(config as AIProviderConfig).provider}"`);
  }
}
