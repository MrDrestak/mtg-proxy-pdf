
export interface CardImage {
  id: string;
  name: string;
  dataUrl: string;
  originalDataUrl?: string;
  type: string;
}

export interface PageLayout {
  pageNumber: number;
  cards: (CardImage | null)[]; // Max 9 cards
}
