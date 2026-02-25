import { objectStorageClient } from './object-storage';

export async function savePostThumbnail(
  imageUrl: string,
  platform: string,
  postId: string,
): Promise<string | null> {
  if (!imageUrl) return null;

  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) return imageUrl;

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return imageUrl;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
        ? 'webp'
        : 'jpg';
    const fileName = `posts/${platform}/${postId}.${extension}`;

    const bucket = objectStorageClient.bucket(bucketId);
    const buffer = Buffer.from(await response.arrayBuffer());

    await bucket.file(`public/${fileName}`).save(buffer, {
      contentType,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });

    return `/objects/uploads/public/${fileName}`;
  } catch {
    return imageUrl;
  }
}
