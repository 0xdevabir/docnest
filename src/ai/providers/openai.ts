import { AIError } from "../errors.js";
import type {
  AIProvider,
  AIProviderConfig,
  AIResponse,
  AIUsage,
  ChatRequest,
  StreamChunk,
} from "../types.js";
import { BaseAdapter } from "./base.js";
import { parseSSE } from "./sse.js";

const API_BASE = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o";

// ── OpenAI wire types ─────────────────────────────────────────────────────────

interface OAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OAIRequest {
  model: string;
  messages: OAIMessage[];
  max_tokens?: number;
  temperature: number;
  stream?: boolean;
  stream_options?: { include_usage: boolean };
}

interface OAIResponse {
  model: string;
  choices: Array<{
    message: { content: string };
    finish_reason: string | null;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number };
}

interface OAIStreamChunk {
  model?: string;
  choices: Array<{
    delta: { content?: string };
    finish_reason: string | null;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class OpenAIAdapter extends BaseAdapter {
  override readonly name: AIProvider = "openai";
  override readonly supportedModels: readonly string[] = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
  ];

  constructor(config: Partial<AIProviderConfig> = {}) {
    const envKey = process.env["OPENAI_API_KEY"];
    super({
      provider: "openai",
      model: DEFAULT_MODEL,
      ...(envKey !== undefined && { apiKey: envKey }),
      ...config,
    });
  }

  override isConfigured(): boolean {
    return typeof this.config.apiKey === "string" && this.config.apiKey.length > 0;
  }

  override async chat(req: ChatRequest): Promise<AIResponse> {
    const { maxTokens, temperature } = this.mergeDefaults(req);
    const body = this.buildBody(req, maxTokens, temperature, false);

    const res = await this.doFetch("/chat/completions", body);
    const json = (await res.json()) as OAIResponse;

    const choice = json.choices[0];
    return {
      content:      choice?.message.content ?? "",
      provider:     "openai",
      model:        json.model,
      usage: {
        inputTokens:  json.usage.prompt_tokens,
        outputTokens: json.usage.completion_tokens,
      },
      finishReason: choice?.finish_reason === "stop" ? "stop" : "length",
    };
  }

  override async *stream(req: ChatRequest): AsyncGenerator<StreamChunk> {
    const { maxTokens, temperature } = this.mergeDefaults(req);
    const body = this.buildBody(req, maxTokens, temperature, true);

    const res = await this.doFetch("/chat/completions", body);
    if (res.body === null) throw new AIError("No response body", "invalid_response", "openai", false);

    let usage: AIUsage | undefined;
    let finishReason: AIResponse["finishReason"];

    for await (const { data } of parseSSE(res.body)) {
      if (data === "[DONE]") break;

      let chunk: OAIStreamChunk;
      try { chunk = JSON.parse(data) as OAIStreamChunk; }
      catch { continue; }

      const choice = chunk.choices[0];
      if (choice?.delta?.content) {
        yield { delta: choice.delta.content, done: false };
      }
      if (choice?.finish_reason != null && choice.finish_reason !== "") {
        finishReason = choice.finish_reason === "stop" ? "stop" : "length";
      }
      if (chunk.usage !== undefined) {
        usage = {
          inputTokens:  chunk.usage.prompt_tokens,
          outputTokens: chunk.usage.completion_tokens,
        };
      }
    }

    yield {
      delta: "",
      done: true as const,
      ...(usage !== undefined && { usage }),
      ...(finishReason !== undefined && { finishReason }),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  protected buildBody(
    req: ChatRequest,
    maxTokens: number,
    temperature: number,
    stream: boolean,
  ): OAIRequest {
    const messages: OAIMessage[] = [];

    // Inject system prompt (prefer top-level `system`, fall back to ChatMessage)
    const systemContent = req.system ?? req.messages.find((m) => m.role === "system")?.content;
    if (systemContent !== undefined) {
      messages.push({ role: "system", content: systemContent });
    }

    for (const m of req.messages) {
      if (m.role === "system") continue; // already handled above
      messages.push({ role: m.role as OAIMessage["role"], content: m.content });
    }

    return {
      model:       req.model ?? this.config.model ?? DEFAULT_MODEL,
      messages,
      max_tokens:  maxTokens,
      temperature,
      ...(stream && { stream: true, stream_options: { include_usage: true } }),
    };
  }

  protected async doFetch(path: string, body: OAIRequest): Promise<Response> {
    const url = (this.config.baseUrl ?? API_BASE) + path;
    const res = await fetch(url, {
      method: "POST",
      signal: this.timeoutSignal(),
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${this.config.apiKey ?? ""}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw AIError.fromHttpStatus(res.status, text, this.name);
    }

    return res;
  }
}
