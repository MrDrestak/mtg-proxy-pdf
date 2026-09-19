
import { PAPER_SIZES, CARD, GRID, getMargins, PaperFormat } from '../constants';
import { PageLayout } from '../types';

export const generateSVG = (pages: PageLayout[], paperFormat: PaperFormat = 'a4') => {
  const paper = PAPER_SIZES[paperFormat];
  const margin = getMargins(paperFormat);

  // We generate one SVG per page as most cutting software expects single files or specific sizing
  pages.forEach((page, pageIdx) => {
    const rects: string[] = [];

    page.cards.forEach((card, cardIdx) => {
      if (!card) return;

      const col = cardIdx % GRID.cols;
      const row = Math.floor(cardIdx / GRID.cols);
      
      const x = margin.left + col * (CARD.width + GRID.spacing);
      const y = margin.top + row * (CARD.height + GRID.spacing);

      rects.push(`<rect x="${x}" y="${y}" width="${CARD.width}" height="${CARD.height}" fill="none" stroke="black" stroke-width="0.1" />`);
    });

    const svgContent = `
<svg width="${paper.width}mm" height="${paper.height}mm" viewBox="0 0 ${paper.width} ${paper.height}" xmlns="http://www.w3.org/2000/svg">
  <g id="CutLines">
    ${rects.join('\n    ')}
  </g>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mtg-cut-lines-${paperFormat}-page-${pageIdx + 1}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  });
};

