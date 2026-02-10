import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Gemini AI Client via Replit AI Integrations
 * 
 * This uses Replit's AI Integrations service, which provides Gemini-compatible 
 * API access without requiring your own API key. Charges are billed to your Replit credits.
 * 
 * Supported models:
 * - gemini-2.5-flash: Fast, good for daily use and high-volume tasks
 * - gemini-2.5-pro: Best for complex reasoning and coding
 * - gemini-2.5-flash-image: Native image generation
 */
export const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-2.5-flash-image";

/**
 * Send a message to Gemini and get a response
 */
export async function sendGeminiMessage(
  content: string,
  options: {
    model?: GeminiModel;
    systemInstruction?: string;
  } = {}
): Promise<string> {
  const { model = "gemini-2.5-flash", systemInstruction } = options;

  const response = await gemini.models.generateContent({
    model,
    contents: content,
    config: systemInstruction ? { systemInstruction } : undefined,
  });

  return response.text || "";
}

/**
 * Stream a message response from Gemini
 */
export async function* streamGeminiMessage(
  content: string,
  options: {
    model?: GeminiModel;
    systemInstruction?: string;
  } = {}
): AsyncGenerator<string> {
  const { model = "gemini-2.5-flash", systemInstruction } = options;

  const stream = await gemini.models.generateContentStream({
    model,
    contents: content,
    config: systemInstruction ? { systemInstruction } : undefined,
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

/**
 * Generate an image using Gemini
 */
export async function generateGeminiImage(prompt: string): Promise<string> {
  const response = await gemini.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}
