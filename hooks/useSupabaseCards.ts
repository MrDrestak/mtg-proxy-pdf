import { useEffect, useState, useCallback } from 'react';
import { CardImage } from '../types';
import {
  loadAllCards,
  saveCard,
  deleteCard,
  updateCardMetadata,
  uploadCardImage
} from '../services/cardServiceSupabase';

interface UseSupabaseCardsReturn {
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
 * Custom hook for managing cards with Supabase backend
 * Falls back to localStorage if Supabase is not configured
 */
export function useSupabaseCards(): UseSupabaseCardsReturn {
  const [cards, setCards] = useState<CardImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if Supabase is configured
  const isSupabaseConfigured = useCallback(() => {
    return !!(
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY
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

  // Initial load - try Supabase first, fall back to localStorage
  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isSupabaseConfigured()) {
          // Load from Supabase
          const dbCards = await loadAllCards();
          setCards(dbCards);
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
  }, [isSupabaseConfigured, loadFromLocalStorage, syncToLocalStorage]);

  // Add new card
  const addCard = useCallback(
    async (card: CardImage, imageData?: string) => {
      try {
        console.log('[useSupabaseCards.addCard] Starting with Supabase:', isSupabaseConfigured(), 'imageData present:', !!imageData);

        if (isSupabaseConfigured() && imageData) {
          console.log('[useSupabaseCards.addCard] Using Supabase path');
          // Upload image to Supabase Storage
          console.log('[useSupabaseCards.addCard] Calling uploadCardImage...');
          const imageUrl = await uploadCardImage(card.id, imageData);
          console.log('[useSupabaseCards.addCard] Image uploaded, URL:', imageUrl);

          // Save card metadata to Supabase
          console.log('[useSupabaseCards.addCard] Calling saveCard...');
          const recordId = await saveCard(card, imageUrl);
          console.log('[useSupabaseCards.addCard] Card saved, recordId:', recordId);

          // Update local state with Supabase ID
          const newCard = {
            ...card,
            id: `supabase_${recordId}`,
            dataUrl: imageUrl
          };
          console.log('[useSupabaseCards.addCard] Updating local state');
          setCards(prev => [...prev, newCard]);
        } else {
          console.log('[useSupabaseCards.addCard] Using localStorage fallback');
          // Save to localStorage only
          const newCard = {
            ...card,
            dataUrl: imageData || card.dataUrl
          };
          setCards(prev => [...prev, newCard]);
        }
        // Sync to localStorage as backup
        console.log('[useSupabaseCards.addCard] Syncing to localStorage');
        syncToLocalStorage();
        console.log('[useSupabaseCards.addCard] Complete');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to add card');
        console.error('[useSupabaseCards.addCard] Error:', error);
        setError(error);
        throw error;
      }
    },
    [isSupabaseConfigured, syncToLocalStorage]
  );

  // Update existing card
  const updateCard = useCallback(
    async (cardId: string, updates: Partial<CardImage>, imageData?: string) => {
      try {
        if (isSupabaseConfigured() && cardId.startsWith('supabase_')) {
          // Update in Supabase
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
    [isSupabaseConfigured, syncToLocalStorage]
  );

  // Remove card
  const removeCard = useCallback(
    async (cardId: string) => {
      try {
        if (isSupabaseConfigured() && cardId.startsWith('supabase_')) {
          // Delete from Supabase
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
    [isSupabaseConfigured, syncToLocalStorage]
  );

  // Refresh cards from backend
  const refreshCards = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const dbCards = await loadAllCards();
        setCards(dbCards);
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
  }, [isSupabaseConfigured, loadFromLocalStorage, syncToLocalStorage]);

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
