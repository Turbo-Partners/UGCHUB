import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic Claude AI Client via Replit AI Integrations
 * 
 * This uses Replit's AI Integrations service, which provides Anthropic-compatible 
 * API access without requiring your own API key. Charges are billed to your Replit credits.
 * 
 * Supported models:
 * - claude-opus-4-5: Most capable, best for complex reasoning and coding tasks
 * - claude-sonnet-4-5: Balanced performance and speed, recommended for most use cases
 * - claude-haiku-4-5: Fastest and most compact, ideal for simple tasks
 */
export const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

export type AnthropicModel = "claude-opus-4-5" | "claude-sonnet-4-5" | "claude-haiku-4-5";

/**
 * Send a message to Claude and get a response
 */
export async function sendMessage(
  content: string,
  options: {
    model?: AnthropicModel;
    systemPrompt?: string;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { model = "claude-sonnet-4-5", systemPrompt, maxTokens = 1024 } = options;

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

/**
 * Stream a message response from Claude
 */
export async function* streamMessage(
  content: string,
  options: {
    model?: AnthropicModel;
    systemPrompt?: string;
    maxTokens?: number;
  } = {}
): AsyncGenerator<string> {
  const { model = "claude-sonnet-4-5", systemPrompt, maxTokens = 1024 } = options;

  const stream = await anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}
