import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cardId, imageData } = request.body;

    if (!cardId || !imageData) {
      return response.status(400).json({ error: 'cardId and imageData required' });
    }

    console.log('[api/upload-image] Uploading image for card:', cardId);

    // Convert data URL to blob
    const parts = imageData.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    const blob = new Blob([u8arr], { type: mimeType });
    console.log('[api/upload-image] Blob created:', { size: blob.size, type: blob.type });

    // Upload to Vercel Blob with server-side token
    const result = await put(
      `cards/${cardId}/image.jpg`,
      blob,
      {
        access: 'public',
        token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
      }
    );

    console.log('[api/upload-image] Upload completed, URL:', result.url);
    return response.json({ url: result.url });
  } catch (error) {
    console.error('[api/upload-image] Error:', error);
    return response
      .status(500)
      .json({ error: 'Upload failed', details: String(error) });
  }
}
