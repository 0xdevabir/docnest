import { AIError } from "../errors.js";
import type {
  AIProvider,
  AIProviderConfig,
  AIResponse,
  AIUsage,
  ChatMessage,
  ChatRequest,
  StreamChunk,
} from "../types.js";
import { BaseAdapter } from "./base.js";
import { parseSSE } from "./sse.js";

const API_BASE = "https://api.anthropic.com/v1";
const API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-6";

// ── Anthropic wire types ──────────────────────────────────────────────────────

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  temperature: number;
  messages: AnthropicMessage[];
  system?: string;
  stream?: boolean;
}

interface AnthropicResponse {
  id: string;
  model: string;
  content: Array<{ type: string; text: string }>;
  stop_reason: string | null;
  usage: { input_tokens: number; output_tokens: number };
}

interface AnthropicStreamEvent {
  type: string;
  index?: number;
  delta?: { type: string; text?: string; stop_reason?: string };
  message?: { usage: { input_tokens: number } };
  usage?: { output_tokens: number };
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export class AnthropicAdapter extends BaseAdapter {
  override readonly name: AIProvider = "anthropic";
  override readonly supportedModels: readonly string[] = [
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
  ];

  constructor(config: Partial<AIProviderConfig> = {}) {
    const envKey = process.env["ANTHROPIC_API_KEY"];
    super({
      provider: "anthropic",
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

    const res = await this.doFetch("/messages", body);
    const json = (await res.json()) as AnthropicResponse;

    const text = json.content.find((b) => b.type === "text")?.text ?? "";
    return {
      content: text,
      provider: "anthropic",
      model: json.model,
      usage: {
        inputTokens: json.usage.input_tokens,
        outputTokens: json.usage.output_tokens,
      },
      finishReason: json.stop_reason === "end_turn" ? "stop" : "length",
    };
  }

  override async *stream(req: ChatRequest): AsyncGenerator<StreamChunk> {
    const { maxTokens, temperature } = this.mergeDefaults(req);
    const body = this.buildBody(req, maxTokens, temperature, true);

    const res = await this.doFetch("/messages", body);
    if (res.body === null) throw new AIError("No response body", "invalid_response", "anthropic", false);

    let inputTokens = 0;
    let outputTokens = 0;
    let finishReason: AIResponse["finishReason"];

    for await (const { data } of parseSSE(res.body)) {
      let event: AnthropicStreamEvent;
      try { event = JSON.parse(data) as AnthropicStreamEvent; }
      catch { continue; }

      if (event.type === "message_start" && event.message !== undefined) {
        inputTokens = event.message.usage.input_tokens;
      } else if (
        event.type === "content_block_delta" &&
        event.delta?.type === "text_delta" &&
        typeof event.delta.text === "string"
      ) {
        yield { delta: event.delta.text, done: false };
      } else if (event.type === "message_delta") {
        if (event.usage !== undefined) outputTokens = event.usage.output_tokens;
        finishReason = event.delta?.stop_reason === "end_turn" ? "stop" : "length";
      }
    }

    yield {
      delta: "",
      done: true as const,
      usage: { inputTokens, outputTokens },
      ...(finishReason !== undefined && { finishReason }),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private buildBody(
    req: ChatRequest,
    maxTokens: number,
    temperature: number,
    stream: boolean,
  ): AnthropicRequest {
    const messages: AnthropicMessage[] = req.messages
      .filter((m): m is ChatMessage & { role: "user" | "assistant" } =>
        m.role === "user" || m.role === "assistant",
      )
      .map((m) => ({ role: m.role, content: m.content }));

    // Extract system message if it arrived as a ChatMessage
    const systemFromMessages = req.messages.find((m) => m.role === "system")?.content;
    const system = req.system ?? systemFromMessages;

    return {
      model:       req.model ?? this.config.model ?? DEFAULT_MODEL,
      max_tokens:  maxTokens,
      temperature,
      messages,
      ...(system !== undefined && { system }),
      ...(stream && { stream: true }),
    };
  }

  private async doFetch(path: string, body: AnthropicRequest): Promise<Response> {
    const url = (this.config.baseUrl ?? API_BASE) + path;
    const res = await fetch(url, {
      method: "POST",
      signal: this.timeoutSignal(),
      headers: {
        "Content-Type":            "application/json",
        "anthropic-version":       API_VERSION,
        "x-api-key":               this.config.apiKey ?? "",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw AIError.fromHttpStatus(res.status, text, "anthropic");
    }

    return res;
  }
}
