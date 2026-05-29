import type {
  AIMiddleware,
  AIProviderAdapter,
  ChatRequest,
  ExplainRequest,
  GenerateRequest,
  StreamChunk,
} from "../types.js";

export interface LoggingOptions {
  /** Log function — defaults to console.debug. */
  log?: (msg: string, meta?: Record<string, unknown>) => void;
  /** Include message content in logs. Default: false (avoids leaking user data). */
  logContent?: boolean;
}

/**
 * Middleware that logs request timings and error details.
 * Does not log content by default — set `logContent: true` for debugging.
 */
export function withLogging(options: LoggingOptions = {}): AIMiddleware {
  const log =
    options.log ??
    function defaultLog(msg: string, meta?: Record<string, unknown>) {
      console.debug(`[ai:${new Date().toISOString()}] ${msg}`, meta ?? "");
    };

  return (inner: AIProviderAdapter): AIProviderAdapter => ({
    ...inner,

    async chat(req: ChatRequest) {
      const t0 = Date.now();
      try {
        const res = await inner.chat(req);
        log(`${inner.name}.chat completed`, {
          model: res.model,
          durationMs: Date.now() - t0,
          inputTokens:  res.usage?.inputTokens,
          outputTokens: res.usage?.outputTokens,
          ...(options.logContent && { content: res.content.slice(0, 120) }),
        });
        return res;
      } catch (err) {
        log(`${inner.name}.chat failed`, { durationMs: Date.now() - t0, error: String(err) });
        throw err;
      }
    },

    async generate(req: GenerateRequest) {
      const t0 = Date.now();
      try {
        const res = await inner.generate(req);
        log(`${inner.name}.generate completed`, {
          template:    req.template,
          durationMs:  Date.now() - t0,
          inputTokens:  res.usage?.inputTokens,
          outputTokens: res.usage?.outputTokens,
        });
        return res;
      } catch (err) {
        log(`${inner.name}.generate failed`, { durationMs: Date.now() - t0, error: String(err) });
        throw err;
      }
    },

    async explain(req: ExplainRequest) {
      const t0 = Date.now();
      try {
        const res = await inner.explain(req);
        log(`${inner.name}.explain completed`, {
          filePath:    req.filePath,
          depth:       req.depth,
          durationMs:  Date.now() - t0,
          outputTokens: res.usage?.outputTokens,
        });
        return res;
      } catch (err) {
        log(`${inner.name}.explain failed`, { durationMs: Date.now() - t0, error: String(err) });
        throw err;
      }
    },

    async *stream(req: ChatRequest): AsyncGenerator<StreamChunk> {
      const t0 = Date.now();
      let chunks = 0;
      try {
        for await (const chunk of inner.stream(req)) {
          if (!chunk.done) chunks++;
          yield chunk;
        }
        log(`${inner.name}.stream completed`, { durationMs: Date.now() - t0, chunks });
      } catch (err) {
        log(`${inner.name}.stream failed`, { durationMs: Date.now() - t0, chunks, error: String(err) });
        throw err;
      }
    },
  });
}
