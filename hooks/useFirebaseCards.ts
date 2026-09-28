import { useEffect, useState, useCallback } from 'react';
import { CardImage } from '../types';
import {
  loadAllCards,
  saveCard,
  deleteCard,
  updateCardMetadata,
  uploadCardImage
} from '../services/cardService';

interface UseFirebaseCardsReturn {
  cards: CardImage[];
  loading: boolean;
  error: Error | null;
  addCard: (card: CardImage, imageData?: string) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<CardImage>, imageData?: string) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  refreshCards: () => Promise<void>;
  syncToLocalStorage: () => void;
}

const STORAGE_KEY = 'mtg_proxy_cards_backup';

/**
 * Custom hook for managing cards with Firebase backend
 * Falls back to localStorage if Firebase is not configured
 */
export function useFirebaseCards(): UseFirebaseCardsReturn {
  const [cards, setCards] = useState<CardImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if Firebase is configured
  const isFirebaseConfigured = useCallback(() => {
    return !!(
      process.env.REACT_APP_FIREBASE_API_KEY &&
      process.env.REACT_APP_FIREBASE_PROJECT_ID
    );
  }, []);

  // Load cards from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCards(parsed);
        return;
      }
    } catch (err) {
      console.warn('Failed to load from localStorage:', err);
    }
    setCards([]);
  }, []);

  // Sync cards to localStorage
  const syncToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (err) {
      console.warn('Failed to sync to localStorage:', err);
    }
  }, [cards]);

  // Initial load - try Firebase first, fall back to localStorage
  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isFirebaseConfigured()) {
          // Load from Firebase
          const fbCards = await loadAllCards();
          setCards(fbCards);
          // Back up to localStorage
          syncToLocalStorage();
        } else {
          // Load from localStorage as fallback
          loadFromLocalStorage();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error('Failed to load cards:', error);
        // Fall back to localStorage on error
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [isFirebaseConfigured, loadFromLocalStorage, syncToLocalStorage]);

  // Add new card
  const addCard = useCallback(
    async (card: CardImage, imageData?: string) => {
      try {
        if (isFirebaseConfigured() && imageData) {
          // Upload image to Firebase Storage
          const imageUrl = await uploadCardImage(card.id, imageData);
          // Save card metadata to Firestore
          const docId = await saveCard(card, imageUrl);
          // Update local state with Firebase ID
          const newCard = {
            ...card,
            id: `firebase_${docId}`,
            dataUrl: imageUrl
          };
          setCards(prev => [...prev, newCard]);
        } else {
          // Save to localStorage only
          const newCard = {
            ...card,
            dataUrl: imageData || card.dataUrl
          };
          setCards(prev => [...prev, newCard]);
        }
        // Sync to localStorage as backup
        syncToLocalStorage();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add card');
        setError(error);
        throw error;
      }
    },
    [isFirebaseConfigured, syncToLocalStorage]
  );

  // Update existing card
  const updateCard = useCallback(
    async (cardId: string, updates: Partial<CardImage>, imageData?: string) => {
      try {
        if (isFirebaseConfigured() && cardId.startsWith('firebase_')) {
          // Update in Firebase
          if (imageData) {
            const imageUrl = await uploadCardImage(cardId, imageData);
            updates.dataUrl = imageUrl;
          }
          await updateCardMetadata(cardId, updates);
        }

        // Update local state
        setCards(prev =>
          prev.map(card =>
            card.id === cardId ? { ...card, ...updates } : card
          )
        );
        // Sync to localStorage
        syncToLocalStorage();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update card');
        setError(error);
        throw error;
      }
    },
    [isFirebaseConfigured, syncToLocalStorage]
  );

  // Remove card
  const removeCard = useCallback(
    async (cardId: string) => {
      try {
        if (isFirebaseConfigured() && cardId.startsWith('firebase_')) {
          // Delete from Firebase
          await deleteCard(cardId);
        }

        // Update local state
        setCards(prev => prev.filter(card => card.id !== cardId));
        // Sync to localStorage
        syncToLocalStorage();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete card');
        setError(error);
        throw error;
      }
    },
    [isFirebaseConfigured, syncToLocalStorage]
  );

  // Refresh cards from backend
  const refreshCards = useCallback(async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        const fbCards = await loadAllCards();
        setCards(fbCards);
        syncToLocalStorage();
      } else {
        loadFromLocalStorage();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh cards');
      setError(error);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }, [isFirebaseConfigured, loadFromLocalStorage, syncToLocalStorage]);

  return {
    cards,
    loading,
    error,
    addCard,
    updateCard,
    removeCard,
    refreshCards,
    syncToLocalStorage
  };
}
