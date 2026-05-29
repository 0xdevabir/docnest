export { withRetry } from "./retry.js";
export { withRateLimit } from "./rate-limit.js";
export { withFallback, FallbackAdapter } from "./fallback.js";
export { withLogging } from "./logging.js";

export type { LoggingOptions } from "./logging.js";

import type { AIMiddleware, AIProviderAdapter } from "../types.js";

/**
 * Compose multiple middleware layers into one.
 *
 * Middleware is applied right-to-left, so the first argument becomes the
 * outermost wrapper (called first on every request).
 *
 * Recommended order for most setups:
 * ```ts
 * compose(
 *   withLogging(),        // outermost — logs every top-level call
 *   withRetry(),          // retries through rate limiting
 *   withRateLimit(),      // innermost — guards the actual API call
 * )
 * ```
 *
 * @example
 * const adapter = compose(
 *   withLogging(),
 *   withRetry({ maxAttempts: 3 }),
 *   withRateLimit({ requestsPerMinute: 60 }),
 * )(new AnthropicAdapter());
 */
export function compose(...middlewares: AIMiddleware[]): AIMiddleware {
  return (adapter: AIProviderAdapter): AIProviderAdapter =>
    // reduceRight → first arg is outermost (called first)
    middlewares.reduceRight((acc, m) => m(acc), adapter);
}
