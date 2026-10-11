
import { CARD, GRID, PAPER_SIZES, getMargins, PaperFormat } from '../constants';
import { PageLayout } from '../types';

export const generateSVG = (pages: PageLayout[], paperFormat: PaperFormat = 'a4') => {
  // Generate a single SVG with one 3x3 grid of cards
  // Takes the first page (9 cards max) from the pages array
  const cardRoundRadius = 2.5; // Rounded corner radius in mm

  // Use the same margins as the PDF generator for alignment
  const margin = getMargins(paperFormat);
  const paper = PAPER_SIZES[paperFormat];

  // Calculate total grid dimensions
  const gridWidth = GRID.cols * CARD.width;
  const gridHeight = GRID.rows * CARD.height;
  const svgWidth = paper.width;
  const svgHeight = paper.height;

  const cardElements: string[] = [];

  // Generate card cutting outlines for the first page only
  if (pages.length > 0) {
    pages[0].cards.forEach((card, cardIdx) => {
      if (!card) return;

      const col = cardIdx % GRID.cols;
      const row = Math.floor(cardIdx / GRID.cols);

      const x = margin.left + col * CARD.width;
      const y = margin.top + row * CARD.height;

      // Add rounded rectangle border (cut line) only
      cardElements.push(
        `<rect x="${x}" y="${y}" width="${CARD.width}" height="${CARD.height}" rx="${cardRoundRadius}" ry="${cardRoundRadius}" fill="none" stroke="black" stroke-width="0.2" />`
      );
    });
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}mm" height="${svgHeight}mm" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <!-- MTG Proxy Card Grid - 3x3 Cutting Guide -->
  <!-- Paper format: ${PAPER_SIZES[paperFormat].name} (${svgWidth} × ${svgHeight}mm) -->
  <!-- Real card dimensions: ${CARD.width}mm × ${CARD.height}mm per card -->
  <!-- Rounded corners: ${cardRoundRadius}mm radius -->
  <!-- Grid margins: left=${margin.left}mm, top=${margin.top}mm -->

  <!-- Card Cutting Outlines -->
  <g id="CuttingGuides" stroke="black" stroke-width="0.2" fill="none">
    ${cardElements.join('\n    ')}
  </g>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filename = paperFormat === 'a4'
    ? 'mtg-cards-3x3-a4.svg'
    : paperFormat === 'letter'
    ? 'mtg-cards-3x3-carta.svg'
    : 'mtg-cards-3x3-oficio.svg';
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
