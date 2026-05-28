import type {
  AIProvider,
  AIProviderAdapter,
  AIProviderConfig,
} from "./types.js";

// ── Registry ───────────────────────────────────────────────────────────────────

class AIProviderRegistry {
  private readonly adapters = new Map<AIProvider, AIProviderAdapter>();

  /**
   * Register a provider adapter. Call this during application startup
   * (or lazily before the first command that needs AI).
   */
  register(adapter: AIProviderAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  /**
   * Look up a registered adapter by name. Returns `undefined` when the
   * provider has not been registered.
   */
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
      throw new Error(
        `AI provider "${provider}" is not registered. ` +
          `Available: ${this.listAvailable().join(", ") || "none"}. ` +
          `Install the corresponding adapter package and register it at startup.`,
      );
    }
    if (!adapter.isConfigured()) {
      throw new Error(
        `AI provider "${provider}" is registered but not configured. ` +
          `Check that its API key / settings are set correctly.`,
      );
    }
    return adapter;
  }

  /** Returns the names of all registered (not necessarily configured) providers. */
  list(): AIProvider[] {
    return [...this.adapters.keys()];
  }

  /** Returns the names of registered AND configured providers. */
  listAvailable(): AIProvider[] {
    return [...this.adapters.entries()]
      .filter(([, adapter]) => adapter.isConfigured())
      .map(([name]) => name);
  }

  /** True when at least one configured provider is available. */
  hasAny(): boolean {
    return this.listAvailable().length > 0;
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────────

export const aiRegistry = new AIProviderRegistry();

// ── Re-exports ─────────────────────────────────────────────────────────────────

export type {
  AIProvider,
  AIProviderAdapter,
  AIProviderConfig,
  AIResponse,
  AIUsage,
  GenerateRequest,
  ExplainRequest,
} from "./types.js";
