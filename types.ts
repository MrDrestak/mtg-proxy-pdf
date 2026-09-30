
export type CardColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'M' | 'C'; // White, Blue, Black, Red, Green, Multicolor, Colorless

export interface CardImage {
  id: string;
  name: string;
  nickname?: string;
  dataUrl: string;
  originalDataUrl?: string;
  type?: string;
  createdAt?: Date;
  colors?: CardColor[];
  tags?: string[];
  notes?: string;
  isFoil?: boolean;
}

export interface PageLayout {
  pageNumber: number;
  cards: (CardImage | null)[]; // Max 9 cards
}

export const MTG_COLORS: Record<CardColor, { label: string; color: string }> = {
  'W': { label: 'Blanco', color: '#F0E6D2' },
  'U': { label: 'Azul', color: '#0E68AB' },
  'B': { label: 'Negro', color: '#150B00' },
  'R': { label: 'Rojo', color: '#D3291C' },
  'G': { label: 'Verde', color: '#00733E' },
  'M': { label: 'Multi', color: '#9D7C3E' },
  'C': { label: 'Incoloro', color: '#C0C0C0' }
};
