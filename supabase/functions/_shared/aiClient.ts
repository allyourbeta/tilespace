/**
 * Single chokepoint for every model call Master View makes. Talks to any
 * OpenAI-compatible chat-completions endpoint — DeepSeek today, a local
 * Ollama/LM Studio server later — by changing only the three env vars
 * below, never this module's callers.
 */

const DEFAULT_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_MODEL = "deepseek-flash";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export class AIClientError extends Error {}

function config() {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY") ?? Deno.env.get("AI_API_KEY");
  if (!apiKey) {
    throw new AIClientError("No model API key configured (DEEPSEEK_API_KEY)");
  }
  return {
    apiKey,
    baseUrl: Deno.env.get("AI_BASE_URL") ?? DEFAULT_BASE_URL,
    model: Deno.env.get("AI_MODEL") ?? DEFAULT_MODEL,
  };
}

/** Plain-text completion (used for the one-document summary call). */
export async function completeText(messages: ChatMessage[]): Promise<string> {
  const { apiKey, baseUrl, model } = config();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AIClientError(`Model request failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new AIClientError("Model response had no text content");
  }
  return content;
}

/**
 * Pulls JSON out of a model's text reply, stripping a markdown code fence
 * first if the model wrapped its answer in one. Pure — no network, no
 * `Deno.*` — so it can be unit-tested from plain Node/vitest as well.
 */
export function extractJSON<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();
  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new AIClientError(`Model did not return valid JSON: ${candidate.slice(0, 300)}`);
  }
}

/** JSON completion: calls the model, then runs its reply through {@link extractJSON}. */
export async function completeJSON<T>(messages: ChatMessage[]): Promise<T> {
  const raw = await completeText(messages);
  return extractJSON<T>(raw);
}
