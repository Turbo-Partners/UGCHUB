import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Gemini AI Client
 *
 * Wrapper for Google Gemini API using Application Default Credentials.
 * Requires GOOGLE_GENAI_API_KEY environment variable.
 */

if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn("GOOGLE_GENAI_API_KEY is not set. Gemini features will fail at runtime.");
}

export const gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || "",
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
