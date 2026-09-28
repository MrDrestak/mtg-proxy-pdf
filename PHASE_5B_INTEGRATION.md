# Phase 5B: App Integration - Firebase Activation

## Overview

Phase 5B integrates the Firebase backend into the main App component, replacing the in-memory React state with cloud-backed persistence.

**Status**: Ready to implement  
**Time to activate**: ~5 minutes of coding + 15 minutes of Firebase setup

## Quick Start (5 Minutes)

### 1. Set Up Firebase Project

```bash
# Open Firebase Console: https://console.firebase.google.com
# Create project → Web app → Copy config values
# Create Firestore database (test mode)
# Create Storage bucket (test mode)
```

### 2. Create `.env.local`

```bash
cp .env.example .env.local
# Edit .env.local with Firebase credentials from console
```

### 3. Update App.tsx (2-Line Change)

**BEFORE** (current - lines 1-17):
```typescript
import React, { useState, useCallback, useMemo } from 'react';
// ... other imports ...

const App: React.FC = () => {
  const [cards, setCards] = useState<CardImage[]>([]);
  // ... rest of state ...
```

**AFTER** (Phase 5B):
```typescript
import React, { useCallback, useMemo } from 'react';
import { useFirebaseCards } from './hooks/useFirebaseCards';
// ... other imports ...

const App: React.FC = () => {
  const { 
    cards, 
    loading, 
    addCard, 
    updateCard, 
    removeCard 
  } = useFirebaseCards();
  // ... rest of state (no setCards anymore) ...
```

### 4. Update Card Handlers

Replace the three card-management functions:

**Remove these**:
```typescript
const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  // ... complex processing logic ...
});

const removeCard = (id: string) => {
  setCards(prev => prev.filter(c => c.id !== id));
  if (selectedCardId === id) setSelectedCardId(null);
};

const clearAll = () => {
  if (confirm('¿Seguro que quieres borrar todas las cartas?')) {
    setCards([]);
    setSelectedCardId(null);
  }
};
```

**Replace with these simple wrappers**:
```typescript
const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  Array.from(files).forEach((file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      const processedDataUrl = await processCardImageWithBlackCorners(rawDataUrl, currentProcessOptions);
      
      const newCard: CardImage = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name.replace(/\.[^.]+$/, ''),
        dataUrl: processedDataUrl,
        originalDataUrl: rawDataUrl,
        type: file.type,
        createdAt: new Date()
      };
      
      // Firebase hook handles cloud upload + localStorage fallback
      try {
        await addCard(newCard, processedDataUrl);
      } catch (error) {
        console.error('Failed to add card:', error);
        alert('Error al subir la carta');
      }
    };
    reader.readAsDataURL(file);
  });
}, [addCard, currentProcessOptions]);

const handleRemoveCard = async (id: string) => {
  try {
    await removeCard(id);
    if (selectedCardId === id) setSelectedCardId(null);
  } catch (error) {
    console.error('Failed to remove card:', error);
    alert('Error al eliminar la carta');
  }
};

const handleClearAll = async () => {
  if (confirm('¿Seguro que quieres borrar todas las cartas?')) {
    try {
      // Delete all cards
      for (const card of cards) {
        await removeCard(card.id);
      }
      setSelectedCardId(null);
    } catch (error) {
      console.error('Failed to clear cards:', error);
      alert('Error al limpiar las cartas');
    }
  }
};
```

### 5. Update AdminPanel Integration

Replace:
```typescript
import AdminPanel from './components/AdminPanel';
// ...
<AdminPanel
  cards={cards}
  onAddCard={handleAddCard}
  onRemoveCard={removeCard}
  onUpdateCard={handleUpdateCard}
  // ...
/>
```

With:
```typescript
import AdminPanelPhase5 from './components/AdminPanelPhase5';
// ...
<AdminPanelPhase5
  cards={cards}
  onAddCard={addCard}
  onRemoveCard={removeCard}
  onUpdateCard={updateCard}
  watermarkOpacity={watermarkOpacity}
  watermarkScale={watermarkScale}
  showWatermark={showWatermark}
  onWatermarkChange={handleWatermarkChange}
  onClose={() => setIsManagerOpen(false)}
  isLoading={loading}
  firebaseEnabled={!!process.env.REACT_APP_FIREBASE_API_KEY}
/>
```

### 6. Add Loading State to Header

During initial load, show loading indicator:

```typescript
{/* In header section, after Admin button */}
{loading && (
  <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-400">
    <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
    <span className="hidden sm:inline">Cargando...</span>
  </div>
)}
```

### 7. Deploy to Vercel

```bash
# Commit code changes
git add App.tsx
git commit -m "Phase 5B: Integrate Firebase cloud persistence"

# Push to GitHub
git push origin main

# Vercel auto-deploys
# Go to Vercel console and add 6 Firebase env variables:
# REACT_APP_FIREBASE_API_KEY
# REACT_APP_FIREBASE_AUTH_DOMAIN
# REACT_APP_FIREBASE_PROJECT_ID
# REACT_APP_FIREBASE_STORAGE_BUCKET
# REACT_APP_FIREBASE_MESSAGING_SENDER_ID
# REACT_APP_FIREBASE_APP_ID
```

## Complete Modified App.tsx Section

Here's the exact code to replace in App.tsx (highlighted lines are changes):

```typescript
import React, { useCallback, useMemo } from 'react';  // ← CHANGE: Remove useState
import { Upload, Trash2, Layout, Info, FileText, List, Lock } from 'lucide-react';
import { useFirebaseCards } from './hooks/useFirebaseCards';  // ← ADD: Import hook
import { CardImage, PageLayout, CardColor } from './types';
// ... rest of imports ...

const App: React.FC = () => {
  // ← REPLACE: Old useState with hook
  const { 
    cards, 
    loading, 
    addCard, 
    updateCard, 
    removeCard 
  } = useFirebaseCards();
  
  // All other state remains the same
  const [activeTab, setActiveTab] = useState<'gallery' | 'print'>('gallery');
  const [isExporting, setIsExporting] = useState(false);
  // ... (keep all existing useState declarations) ...

  // Remove handleAddCard, handleUpdateCard, removeCard, clearAll
  // Keep handleFileUpload but update it (see above)
  
  const handleRemoveCard = async (id: string) => {
    try {
      await removeCard(id);
      if (selectedCardId === id) setSelectedCardId(null);
    } catch (error) {
      console.error('Failed to remove card:', error);
    }
  };

  // ... rest of handlers remain the same ...

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header - ADD loading indicator */}
      <header className="bg-gradient-to-r from-black via-black to-blue-900/20 border-b border-blue-500/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">▶</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">MTG Proxy Labs</h1>
                <p className="text-xs text-blue-300 font-semibold">Art Gallery</p>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center bg-slate-900/50 border border-blue-500/20 rounded-lg p-1 gap-1">
              {/* ... tab buttons ... */}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-400">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                  <span className="hidden sm:inline">Cargando...</span>
                </div>
              )}
              
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors border border-amber-500/30"
              >
                <Lock size={16} />
                <span className="hidden sm:inline">Admin</span>
              </button>

              <button
                onClick={() => handleClearAll()}  // ← CHANGE: Now async
                disabled={cards.length === 0 || loading}  // ← ADD: Disable during load
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-red-500/30"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Limpiar</span>
              </button>

              <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed">
                <Upload size={16} />
                <span className="hidden sm:inline">Subir</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  disabled={loading}  // ← ADD: Disable during load
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Rest of component remains the same, just update AdminPanel import */}
      {isAdminLoggedIn && (
        <AdminPanelPhase5  {/* ← CHANGE: Was AdminPanel */}
          cards={cards}
          onAddCard={addCard}  // ← CHANGE: Was handleAddCard
          onRemoveCard={handleRemoveCard}  // ← CHANGE: Was removeCard
          onUpdateCard={updateCard}  // ← CHANGE: Was handleUpdateCard
          watermarkOpacity={watermarkOpacity}
          watermarkScale={watermarkScale}
          showWatermark={showWatermark}
          onWatermarkChange={handleWatermarkChange}
          onClose={() => {
            setIsManagerOpen(false);
            setIsAdminLoggedIn(false);
          }}
          isLoading={loading}  // ← ADD
          firebaseEnabled={!!process.env.REACT_APP_FIREBASE_API_KEY}  // ← ADD
        />
      )}
    </div>
  );
};

export default App;
```

## Testing Checklist

After making changes:

- [ ] **Local Test (localStorage)**
  ```bash
  npm start
  # Upload 2-3 cards
  # Reload page (F5)
  # Cards should appear (from localStorage)
  ```

- [ ] **Firebase Configuration**
  ```bash
  # Edit .env.local with Firebase credentials
  npm start
  # Upload cards again
  # Check browser DevTools → Application → Storage → indexedDB
  # Should see Firebase data
  ```

- [ ] **Cloud Persistence**
  - Upload card
  - Go to Firebase Console → Firestore → Collections → cards
  - Should see document with card metadata
  - Go to Firebase Console → Storage → cards
  - Should see image file

- [ ] **Deployment**
  ```bash
  git add App.tsx
  git commit -m "Phase 5B: Integrate Firebase"
  git push origin main
  # Go to Vercel → Add 6 environment variables
  # Redeploy
  # Test on live Vercel site
  ```

## Troubleshooting

**Problem**: Cards don't save to Firebase
- Check `.env.local` has all 6 variables
- Check Firestore has collection "cards"
- Check Storage rules allow writes
- Check browser console for errors

**Problem**: "Loading..." spinner never goes away
- Check Firebase initialization in browser console
- Verify credentials are correct
- Check network tab for failed requests

**Problem**: TypeError in useFirebaseCards hook
- Verify Firebase SDK imported correctly
- Check services/firebaseConfig.ts exists
- Verify Hook syntax (using `useFirebaseCards()` not `useFirebaseCards`)

## Performance Notes

- First load takes 1-2 seconds (Firebase initialization)
- Subsequent loads are instant (cached in localStorage)
- Images uploaded in parallel (up to 3 at a time)
- Firestore queries optimized with indexes (auto-created)

## Next: Phase 5C (Authentication)

Once Phase 5B is working:
- Implement email/password auth
- Make card galleries user-specific
- Add sharing/public galleries feature
- Implement admin-only access to settings

---

**Phase 5B Status**: Ready to implement  
**Estimated time**: 15 minutes (Firebase setup + testing)  
**Difficulty**: Beginner-friendly - mostly copy/paste
