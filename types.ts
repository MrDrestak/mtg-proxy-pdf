
export interface CardImage {
  id: string;
  name: string;
  nickname?: string;
  dataUrl: string;
  originalDataUrl?: string;
  type: string;
  createdAt?: Date;
}

export interface PageLayout {
  pageNumber: number;
  cards: (CardImage | null)[]; // Max 9 cards
}
