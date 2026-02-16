import fs from "node:fs";
import OpenAI, { toFile } from "openai";
import { Buffer } from "node:buffer";

/**
 * OpenAI Client
 *
 * Wrapper for OpenAI SDK.
 * Requires OPENAI_API_KEY environment variable.
 */

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Lazy-loaded proxy to defer client instantiation until first use
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    const client = getOpenAIClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Generate an image and return as Buffer.
 * Uses dall-e-3 or dall-e-2 model.
 */
export async function generateImageBuffer(
  prompt: string,
  options: {
    model?: "dall-e-3" | "dall-e-2";
    size?: "1024x1024" | "512x512" | "256x256" | "1792x1024" | "1024x1792";
  } = {}
): Promise<Buffer> {
  const { model = "dall-e-2", size = "1024x1024" } = options;

  const response = await openai.images.generate({
    model,
    prompt,
    size,
    response_format: "b64_json",
  });

  const base64 = response.data?.[0]?.b64_json ?? "";
  return Buffer.from(base64, "base64");
}

/**
 * Edit/combine multiple images into a composite.
 * Uses dall-e-2 model (dall-e-3 doesn't support edits).
 */
export async function editImages(
  imageFiles: string[],
  prompt: string,
  outputPath?: string
): Promise<Buffer> {
  const images = await Promise.all(
    imageFiles.map((file) =>
      toFile(fs.createReadStream(file), file, {
        type: "image/png",
      })
    )
  );

  const response = await openai.images.edit({
    model: "dall-e-2",
    image: images,
    prompt,
    response_format: "b64_json",
  });

  const imageBase64 = response.data?.[0]?.b64_json ?? "";
  const imageBytes = Buffer.from(imageBase64, "base64");

  if (outputPath) {
    fs.writeFileSync(outputPath, imageBytes);
  }

  return imageBytes;
}
