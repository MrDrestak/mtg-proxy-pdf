import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { CardImage } from '../types';
import { put, del } from '@vercel/blob';

const CARDS_COLLECTION = 'cards';

/**
 * Upload an image to Firebase Storage
 * Returns the download URL for use in the card document
 */
export async function uploadCardImage(cardId: string, imageData: string): Promise<string> {
  try {
    console.log('[uploadCardImage] Starting upload for card:', cardId);

    // Convert data URL to blob (data URLs cannot be fetched directly)
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
    console.log('[uploadCardImage] Blob created:', { size: blob.size, type: blob.type });

    // Upload to Vercel Blob
    console.log('[uploadCardImage] Starting Vercel Blob upload...');
    const result = await put(
      `cards/${cardId}/image.jpg`,
      blob,
      { access: 'public' }
    );
    console.log('[uploadCardImage] Upload completed, URL:', result.url);

    return result.url;
  } catch (error) {
    console.error('Error uploading card image:', error);
    throw error;
  }
}

/**
 * Delete a card image from Vercel Blob Storage
 */
export async function deleteCardImage(cardId: string): Promise<void> {
  try {
    const blobUrl = `https://blob.vercel.sh/cards/${cardId}/image.jpg`;
    await del(blobUrl);
  } catch (error) {
    console.error('Error deleting card image:', error);
    // Don't throw - storage file may not exist
  }
}

/**
 * Save a card to Firestore (create or update)
 * If card has no docId, creates new document
 * If card has docId, updates existing document
 */
export async function saveCard(card: CardImage, imageUrl?: string): Promise<string> {
  try {
    const cardData: any = {
      name: card.name,
      nickname: card.nickname || null,
      colors: card.colors || [],
      tags: card.tags || [],
      notes: card.notes || null,
      createdAt: card.createdAt ? Timestamp.fromDate(new Date(card.createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    console.log('[saveCard] Saving card with data:', cardData);

    // Include image URL if provided
    if (imageUrl) {
      cardData.dataUrl = imageUrl;
    }

    if (card.id && card.id.startsWith('firebase_')) {
      // Update existing document
      const docId = card.id.replace('firebase_', '');
      const docRef = doc(db, CARDS_COLLECTION, docId);
      await updateDoc(docRef, cardData);
      return docId;
    } else {
      // Create new document
      const docRef = await addDoc(collection(db, CARDS_COLLECTION), cardData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving card:', error);
    throw error;
  }
}

/**
 * Load all cards from Firestore
 */
export async function loadAllCards(): Promise<CardImage[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CARDS_COLLECTION));
    const cards: CardImage[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      cards.push({
        id: `firebase_${docSnapshot.id}`,
        name: data.name,
        nickname: data.nickname || undefined,
        dataUrl: data.dataUrl || '',
        originalDataUrl: data.dataUrl || '',
        type: 'image/jpeg',
        colors: data.colors || [],
        tags: data.tags || [],
        notes: data.notes || undefined,
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });

    return cards;
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
    const constraints: QueryConstraint[] = colors.length > 0
      ? [where('colors', 'array-contains-any', colors)]
      : [];

    const q = query(collection(db, CARDS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    const cards: CardImage[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      cards.push({
        id: `firebase_${docSnapshot.id}`,
        name: data.name,
        nickname: data.nickname || undefined,
        dataUrl: data.dataUrl || '',
        originalDataUrl: data.dataUrl || '',
        type: 'image/jpeg',
        colors: data.colors || [],
        tags: data.tags || [],
        notes: data.notes || undefined,
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });

    return cards;
  } catch (error) {
    console.error('Error loading filtered cards:', error);
    return [];
  }
}

/**
 * Load cards filtered by tags
 */
export async function loadCardsByTags(tags: string[]): Promise<CardImage[]> {
  if (tags.length === 0) return [];

  try {
    const constraints: QueryConstraint[] = [where('tags', 'array-contains-any', tags)];
    const q = query(collection(db, CARDS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    const cards: CardImage[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      cards.push({
        id: `firebase_${docSnapshot.id}`,
        name: data.name,
        nickname: data.nickname || undefined,
        dataUrl: data.dataUrl || '',
        originalDataUrl: data.dataUrl || '',
        type: 'image/jpeg',
        colors: data.colors || [],
        tags: data.tags || [],
        notes: data.notes || undefined,
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });

    return cards;
  } catch (error) {
    console.error('Error loading cards by tags:', error);
    return [];
  }
}

/**
 * Delete a card from Firestore and Storage
 */
export async function deleteCard(cardId: string): Promise<void> {
  try {
    const docId = cardId.replace('firebase_', '');

    // Delete from Firestore
    await deleteDoc(doc(db, CARDS_COLLECTION, docId));

    // Delete image from Storage
    await deleteCardImage(docId);
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
    const docId = cardId.replace('firebase_', '');
    const docRef = doc(db, CARDS_COLLECTION, docId);

    const updateData: any = {
      updatedAt: Timestamp.now()
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.nickname !== undefined) updateData.nickname = updates.nickname || null;
    if (updates.colors) updateData.colors = updates.colors;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.notes !== undefined) updateData.notes = updates.notes || null;

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating card metadata:', error);
    throw error;
  }
}
