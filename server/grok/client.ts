/** xAI Grok chat-completions client behind a small interface so tests (and CI) can inject a fake. */
import type { FetchLike } from "../retrieval/types.js";

export interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GrokClient {
  readonly model: string;
  complete(messages: GrokMessage[]): Promise<string>;
}

export interface XaiClientOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
  fetch: FetchLike;
}

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const TEMPERATURE = 0.2;
const MAX_TOKENS = 900;

export function createXaiClient(options: XaiClientOptions): GrokClient {
  async function request(messages: GrokMessage[], jsonMode: boolean): Promise<string> {
    const body: Record<string, unknown> = { model: options.model, messages, temperature: TEMPERATURE, max_tokens: MAX_TOKENS };
    if (jsonMode) body.response_format = { type: "json_object" };

    const res = await options.fetch(XAI_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${options.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (!res.ok) throw new Error(`xai_${res.status}`);
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("xai_empty_reply");
    return content;
  }

  return {
    model: options.model,
    async complete(messages) {
      try {
        return await request(messages, true);
      } catch (error) {
        // Some models reject response_format; retry once without it. Timeouts/5xx propagate.
        if (error instanceof Error && /^xai_(400|422)$/.test(error.message)) return request(messages, false);
        throw error;
      }
    },
  };
}
