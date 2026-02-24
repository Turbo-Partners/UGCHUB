import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Gemini AI Client
 *
 * Wrapper for Google Gemini API using Application Default Credentials.
 * Requires GOOGLE_GENAI_API_KEY environment variable.
 */

let _gemini: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_gemini) {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      throw new Error("GOOGLE_GENAI_API_KEY is not set. Cannot use Gemini features.");
    }
    _gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
  }
  return _gemini;
}

/** @deprecated Use getGeminiClient() instead */
export const gemini = new Proxy({} as GoogleGenAI, {
  get(_, prop) {
    return (getGeminiClient() as any)[prop];
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
 * Send a multimodal message (text + images) to Gemini.
 * Useful for visual analysis (logo, screenshots, etc.)
 */
export async function sendGeminiMultimodal(
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } } | { fileData: { mimeType: string; fileUri: string } }>,
  options: {
    model?: GeminiModel;
    systemInstruction?: string;
  } = {}
): Promise<string> {
  const { model = "gemini-2.5-flash", systemInstruction } = options;

  const response = await gemini.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: systemInstruction ? { systemInstruction } : undefined,
  });

  return response.text || "";
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
