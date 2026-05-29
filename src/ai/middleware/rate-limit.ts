import type {
  AIMiddleware,
  AIProviderAdapter,
  ChatRequest,
  ExplainRequest,
  GenerateRequest,
  RateLimitOptions,
  StreamChunk,
} from "../types.js";

// ── Token bucket ──────────────────────────────────────────────────────────────

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly msPerToken: number; // ms between token regeneration

  constructor(requestsPerMinute: number) {
    this.capacity    = requestsPerMinute;
    this.tokens      = requestsPerMinute;
    this.lastRefill  = Date.now();
    this.msPerToken  = 60_000 / requestsPerMinute;
  }

  async acquire(): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await sleep(Math.max(this.msPerToken - (Date.now() - this.lastRefill), 10));
    }
  }

  private refill(): void {
    const now = Date.now();
    const earned = (now - this.lastRefill) / this.msPerToken;
    if (earned >= 1) {
      this.tokens = Math.min(this.capacity, this.tokens + Math.floor(earned));
      this.lastRefill = now;
    }
  }
}

// ── Semaphore (concurrency cap) ───────────────────────────────────────────────

class Semaphore {
  private available: number;
  private readonly queue: Array<() => void> = [];

  constructor(capacity: number) {
    this.available = capacity;
  }

  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
  }

  release(): void {
    const next = this.queue.shift();
    if (next !== undefined) {
      next();
    } else {
      this.available++;
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function guarded<T>(
  bucket: TokenBucket,
  semaphore: Semaphore,
  fn: () => Promise<T>,
): Promise<T> {
  await bucket.acquire();
  await semaphore.acquire();
  try {
    return await fn();
  } finally {
    semaphore.release();
  }
}

/**
 * Middleware that enforces a per-minute request cap and a concurrent-request limit.
 * Uses a token-bucket algorithm for the rate limit and a semaphore for concurrency.
 */
export function withRateLimit(options: RateLimitOptions = {}): AIMiddleware {
  const bucket    = new TokenBucket(options.requestsPerMinute ?? 60);
  const semaphore = new Semaphore(options.maxConcurrent ?? 5);

  return (inner: AIProviderAdapter): AIProviderAdapter => ({
    ...inner,

    chat:    (req: ChatRequest)     => guarded(bucket, semaphore, () => inner.chat(req)),
    generate:(req: GenerateRequest) => guarded(bucket, semaphore, () => inner.generate(req)),
    explain: (req: ExplainRequest)  => guarded(bucket, semaphore, () => inner.explain(req)),

    async *stream(req: ChatRequest): AsyncGenerator<StreamChunk> {
      await bucket.acquire();
      await semaphore.acquire();
      try {
        yield* inner.stream(req);
      } finally {
        semaphore.release();
      }
    },
  });
}
