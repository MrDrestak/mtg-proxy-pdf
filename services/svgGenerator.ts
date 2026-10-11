
import { CARD, GRID } from '../constants';
import { PageLayout } from '../types';

export const generateSVG = (pages: PageLayout[]) => {
  // Generate one SVG per page containing a 3x3 grid of cards
  // Each card has real MTG dimensions (63mm × 88mm) with rounded corners
  pages.forEach((page, pageIdx) => {
    const cardRoundRadius = 1.8; // Rounded corner radius in mm (standard MTG card corner)
    const padding = 5; // Small padding around the grid for safety margin

    // Calculate total grid dimensions
    const gridWidth = GRID.cols * CARD.width;
    const gridHeight = GRID.rows * CARD.height;
    const svgWidth = gridWidth + padding * 2;
    const svgHeight = gridHeight + padding * 2;

    const cardElements: string[] = [];

    // Generate card cutting outlines only (no images)
    page.cards.forEach((card, cardIdx) => {
      if (!card) return;

      const col = cardIdx % GRID.cols;
      const row = Math.floor(cardIdx / GRID.cols);

      const x = padding + col * CARD.width;
      const y = padding + row * CARD.height;

      // Add rounded rectangle border (cut line) only
      cardElements.push(
        `<rect x="${x}" y="${y}" width="${CARD.width}" height="${CARD.height}" rx="${cardRoundRadius}" ry="${cardRoundRadius}" fill="none" stroke="black" stroke-width="0.2" />`
      );
    });

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}mm" height="${svgHeight}mm" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <!-- MTG Proxy Card Grid - 3x3 Cutting Guide -->
  <!-- Real card dimensions: ${CARD.width}mm × ${CARD.height}mm per card -->
  <!-- Rounded corners: ${cardRoundRadius}mm radius -->

  <!-- Card Cutting Outlines -->
  <g id="CuttingGuides" stroke="black" stroke-width="0.2" fill="none">
    ${cardElements.join('\n    ')}
  </g>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mtg-cards-3x3-page-${pageIdx + 1}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  });
};

