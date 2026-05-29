import { AIError } from "../errors.js";
import type {
  AIMiddleware,
  AIProviderAdapter,
  ChatRequest,
  ExplainRequest,
  GenerateRequest,
  RetryOptions,
  StreamChunk,
} from "../types.js";

const DEFAULTS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs:  30_000,
  jitter:      0.25,
};

function isRetryable(err: unknown): boolean {
  if (err instanceof AIError) return err.retryable;
  // Treat network errors and timeouts as retryable
  if (err instanceof TypeError && (err as TypeError).message.includes("fetch")) return true;
  return false;
}

function backoffMs(attempt: number, opts: Required<RetryOptions>): number {
  const base = Math.min(opts.baseDelayMs * 2 ** attempt, opts.maxDelayMs);
  return base * (1 + opts.jitter * Math.random());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetryFn<T>(
  fn: () => Promise<T>,
  opts: Required<RetryOptions>,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === opts.maxAttempts - 1) break;
      await sleep(backoffMs(attempt, opts));
    }
  }
  throw lastErr;
}

async function* withRetryStream(
  factory: () => AsyncGenerator<StreamChunk>,
  opts: Required<RetryOptions>,
): AsyncGenerator<StreamChunk> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    let started = false;
    try {
      for await (const chunk of factory()) {
        started = true;
        yield chunk;
      }
      return;
    } catch (err) {
      lastErr = err;
      // Never retry a stream that has already started yielding
      if (started || !isRetryable(err) || attempt === opts.maxAttempts - 1) break;
      await sleep(backoffMs(attempt, opts));
    }
  }
  throw lastErr;
}

/**
 * Middleware that retries transient failures with exponential backoff + jitter.
 * Only errors with `retryable: true` (e.g. 429, 5xx, network errors) trigger retries.
 * Streaming retries only if the stream hasn't started yielding yet.
 */
export function withRetry(options: RetryOptions = {}): AIMiddleware {
  const opts = { ...DEFAULTS, ...options };

  return (inner: AIProviderAdapter): AIProviderAdapter => ({
    ...inner,

    chat:    (req: ChatRequest)    => withRetryFn(() => inner.chat(req), opts),
    generate:(req: GenerateRequest)=> withRetryFn(() => inner.generate(req), opts),
    explain: (req: ExplainRequest) => withRetryFn(() => inner.explain(req), opts),
    stream:  (req: ChatRequest)    => withRetryStream(() => inner.stream(req), opts),
  });
}
