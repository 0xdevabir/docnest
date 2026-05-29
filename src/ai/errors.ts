import type { AIProvider } from "./types.js";

export type AIErrorCode =
  | "auth_error"          // 401 — bad API key
  | "rate_limited"        // 429 — provider throttling
  | "quota_exceeded"      // 402/403 — plan limit hit
  | "model_not_found"     // 404 — unknown model id
  | "context_too_long"    // 413 — input exceeds context window
  | "server_error"        // 5xx — transient upstream error
  | "network_error"       // fetch failed
  | "timeout"             // request exceeded timeout
  | "invalid_response"    // response couldn't be parsed
  | "not_configured"      // adapter missing credentials
  | "all_providers_failed"; // fallback exhausted

export class AIError extends Error {
  override readonly name = "AIError";

  constructor(
    message: string,
    readonly code: AIErrorCode,
    readonly provider: AIProvider | "fallback",
    /** True when a retry might succeed. */
    readonly retryable: boolean,
    readonly statusCode?: number,
    cause?: unknown,
  ) {
    super(message, cause !== undefined ? { cause } : undefined);
  }

  static fromHttpStatus(status: number, body: string, provider: AIProvider): AIError {
    switch (status) {
      case 401:
        return new AIError(
          `${provider}: authentication failed — check your API key`,
          "auth_error", provider, false, status,
        );
      case 429:
        return new AIError(
          `${provider}: rate limited — retry after a delay`,
          "rate_limited", provider, true, status,
        );
      case 402:
      case 403:
        return new AIError(
          `${provider}: quota exceeded or access denied`,
          "quota_exceeded", provider, false, status,
        );
      case 404:
        return new AIError(
          `${provider}: model not found`,
          "model_not_found", provider, false, status,
        );
      case 413:
        return new AIError(
          `${provider}: input too long for context window`,
          "context_too_long", provider, false, status,
        );
      default:
        return new AIError(
          `${provider}: server error (${status}) — ${body.slice(0, 200)}`,
          "server_error", provider, status >= 500, status,
        );
    }
  }
}
