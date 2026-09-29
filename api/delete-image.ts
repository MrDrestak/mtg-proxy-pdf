import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del } from '@vercel/blob';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // CORS headers
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'DELETE') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cardId } = request.body;

    if (!cardId) {
      return response.status(400).json({ error: 'cardId required' });
    }

    console.log('[api/delete-image] Deleting image for card:', cardId);

    const blobUrl = `https://blob.vercel.sh/cards/${cardId}/image.jpg`;
    await del(blobUrl, {
      token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    });

    console.log('[api/delete-image] Delete completed');
    return response.json({ success: true });
  } catch (error) {
    console.error('[api/delete-image] Error:', error);
    return response
      .status(500)
      .json({ error: 'Delete failed', details: String(error) });
  }
}
