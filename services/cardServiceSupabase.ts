import { supabase } from './supabaseConfig';
import { CardImage } from '../types';

const CARDS_TABLE = 'cards';
const STORAGE_BUCKET = 'card-images';

/**
 * Upload card image to Supabase Storage
 * Returns the signed URL for the image
 */
export async function uploadCardImage(cardId: string, imageData: string): Promise<string> {
  try {
    console.log('[uploadCardImage] Uploading image for card:', cardId);

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

    // Upload to Supabase Storage
    const filename = `${cardId}-${Date.now()}.jpg`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`cards/${filename}`, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    console.log('[uploadCardImage] Upload completed:', data.path);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading card image:', error);
    throw error;
  }
}

/**
 * Delete card image from Supabase Storage
 */
export async function deleteCardImage(storagePath: string): Promise<void> {
  try {
    console.log('[deleteCardImage] Deleting image:', storagePath);

    if (!storagePath) {
      console.log('[deleteCardImage] No storage path, skipping delete');
      return;
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) throw error;

    console.log('[deleteCardImage] Delete completed');
  } catch (error) {
    console.error('Error deleting card image:', error);
    // Don't throw - image deletion failure shouldn't block card deletion
  }
}

/**
 * Save a card to Supabase (create or update)
 */
export async function saveCard(card: CardImage, imageUrl?: string): Promise<string> {
  try {
    console.log('[saveCard] Saving card:', card.name);

    const cardData: any = {
      name: card.name,
      nickname: card.nickname || null,
      colors: card.colors || [],
      tags: card.tags || [],
      notes: card.notes || null,
      created_at: card.createdAt ? new Date(card.createdAt).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Include image URL if provided
    if (imageUrl) {
      cardData.image_url = imageUrl;
      cardData.storage_path = imageUrl.split('/').slice(-2).join('/');
    }

    if (card.id && card.id.startsWith('supabase_')) {
      // Update existing record
      const recordId = card.id.replace('supabase_', '');
      const { data, error } = await supabase
        .from(CARDS_TABLE)
        .update(cardData)
        .eq('id', recordId)
        .select();

      if (error) throw error;
      return recordId;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from(CARDS_TABLE)
        .insert([cardData])
        .select();

      if (error) throw error;
      return data[0].id;
    }
  } catch (error) {
    console.error('Error saving card:', error);
    throw error;
  }
}

/**
 * Load all cards from Supabase
 */
export async function loadAllCards(): Promise<CardImage[]> {
  try {
    const { data, error } = await supabase
      .from(CARDS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: `supabase_${row.id}`,
      name: row.name,
      nickname: row.nickname || undefined,
      dataUrl: row.image_url || '',
      originalDataUrl: row.image_url || '',
      type: 'image/jpeg',
      colors: row.colors || [],
      tags: row.tags || [],
      notes: row.notes || undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    }));
  } catch (error) {
    console.error('Error loading cards:', error);
    return [];
  }
}

/**
 * Load cards filtered by color
 */
export async function loadCardsByColor(colors: string[]): Promise<CardImage[]> {
  if (colors.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from(CARDS_TABLE)
      .select('*')
      .filter('colors', 'cs', `{${colors.join(',')}}`);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: `supabase_${row.id}`,
      name: row.name,
      nickname: row.nickname || undefined,
      dataUrl: row.image_url || '',
      originalDataUrl: row.image_url || '',
      type: 'image/jpeg',
      colors: row.colors || [],
      tags: row.tags || [],
      notes: row.notes || undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    }));
  } catch (error) {
    console.error('Error loading cards by color:', error);
    return [];
  }
}

/**
 * Load cards filtered by tags
 */
export async function loadCardsByTags(tags: string[]): Promise<CardImage[]> {
  if (tags.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from(CARDS_TABLE)
      .select('*')
      .filter('tags', 'cs', `{${tags.join(',')}}`);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: `supabase_${row.id}`,
      name: row.name,
      nickname: row.nickname || undefined,
      dataUrl: row.image_url || '',
      originalDataUrl: row.image_url || '',
      type: 'image/jpeg',
      colors: row.colors || [],
      tags: row.tags || [],
      notes: row.notes || undefined,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    }));
  } catch (error) {
    console.error('Error loading cards by tags:', error);
    return [];
  }
}

/**
 * Delete a card and its image
 */
export async function deleteCard(cardId: string): Promise<void> {
  try {
    const recordId = cardId.replace('supabase_', '');

    // Get the card to find the storage path
    const { data: card, error: selectError } = await supabase
      .from(CARDS_TABLE)
      .select('storage_path')
      .eq('id', recordId)
      .single();

    if (selectError) throw selectError;

    // Delete image from storage
    if (card?.storage_path) {
      await deleteCardImage(card.storage_path);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from(CARDS_TABLE)
      .delete()
      .eq('id', recordId);

    if (deleteError) throw deleteError;

    console.log('[deleteCard] Card deleted:', recordId);
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
}

/**
 * Update card metadata (without re-uploading image)
 */
export async function updateCardMetadata(
  cardId: string,
  updates: Partial<Omit<CardImage, 'dataUrl'>>
): Promise<void> {
  try {
    const recordId = cardId.replace('supabase_', '');

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.nickname !== undefined) updateData.nickname = updates.nickname || null;
    if (updates.colors) updateData.colors = updates.colors;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;

    const { error } = await supabase
      .from(CARDS_TABLE)
      .update(updateData)
      .eq('id', recordId);

    if (error) throw error;

    console.log('[updateCardMetadata] Card metadata updated:', recordId);
  } catch (error) {
    console.error('Error updating card metadata:', error);
    throw error;
  }
}
