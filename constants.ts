
export type PaperFormat = 'a4' | 'letter' | 'legal';

export interface PaperDimensions {
  width: number;
  height: number;
  name: string;
}

export const PAPER_SIZES: Record<PaperFormat, PaperDimensions> = {
  a4: {
    width: 210,
    height: 297,
    name: 'A4 (210 × 297 mm)',
  },
  letter: {
    width: 215.9,
    height: 279.4,
    name: 'Carta (215.9 × 279.4 mm)',
  },
  legal: {
    width: 215,
    height: 330,
    name: 'Oficio Perú (21.5 × 33 cm)',
  },
};

/**
 * All dimensions in Millimeters (mm) for A4 Paper (default)
 */
export const PAPER = PAPER_SIZES.a4;

export const CARD = {
  width: 63,
  height: 88,
};

export const GRID = {
  cols: 3,
  rows: 3,
  spacing: 0, // Gap between cards (0 to eliminate spacing)
};

// Function to calculate margins for any paper format
export const getMargins = (format: PaperFormat = 'a4') => {
  const paper = PAPER_SIZES[format];
  return {
    left: (paper.width - (GRID.cols * CARD.width + (GRID.cols - 1) * GRID.spacing)) / 2,
    top: (paper.height - (GRID.rows * CARD.height + (GRID.rows - 1) * GRID.spacing)) / 2,
  };
};

// Default margins for backward compatibility (A4)
export const MARGIN = getMargins('a4');

// Conversion factors
export const MM_TO_PX = 3.7795275591; // Approximation for preview rendering
export const CROP_MARK_SIZE = 5; // Length of crop marks in mm

