import express from 'express';
import cors from 'cors';
import { put, del } from '@vercel/blob';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;

/**
 * POST /api/upload-image
 * Uploads an image blob to Vercel Blob Storage
 * Body: { cardId: string, imageData: string (data URL) }
 */
app.post('/api/upload-image', async (req, res) => {
  try {
    const { cardId, imageData } = req.body;

    if (!cardId || !imageData) {
      return res.status(400).json({ error: 'cardId and imageData required' });
    }

    console.log('[server] Uploading image for card:', cardId);

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
    console.log('[server] Blob created:', { size: blob.size, type: blob.type });

    // Upload to Vercel Blob with server-side token
    const result = await put(
      `cards/${cardId}/image.jpg`,
      blob,
      {
        access: 'public',
        token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
      }
    );

    console.log('[server] Upload completed, URL:', result.url);
    res.json({ url: result.url });
  } catch (error) {
    console.error('[server] Error uploading image:', error);
    res.status(500).json({ error: 'Upload failed', details: String(error) });
  }
});

/**
 * DELETE /api/delete-image
 * Deletes an image from Vercel Blob Storage
 * Body: { cardId: string }
 */
app.delete('/api/delete-image', async (req, res) => {
  try {
    const { cardId } = req.body;

    if (!cardId) {
      return res.status(400).json({ error: 'cardId required' });
    }

    console.log('[server] Deleting image for card:', cardId);

    const blobUrl = `https://blob.vercel.sh/cards/${cardId}/image.jpg`;
    await del(blobUrl, {
      token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
    });

    console.log('[server] Delete completed');
    res.json({ success: true });
  } catch (error) {
    console.error('[server] Error deleting image:', error);
    res.status(500).json({ error: 'Delete failed', details: String(error) });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT}`);
  console.log(`[server] VERCEL_BLOB_READ_WRITE_TOKEN configured: ${!!process.env.VERCEL_BLOB_READ_WRITE_TOKEN}`);
});
