
import { jsPDF } from 'jspdf';
import { PAPER_SIZES, CARD, GRID, getMargins, PaperFormat } from '../constants';
import { PageLayout } from '../types';

export const generatePDF = async (
  pages: PageLayout[],
  scaleX: number = 1.0,
  scaleY: number = 1.0,
  paperFormat: PaperFormat = 'a4',
  foilMode: boolean = false
) => {
  const paper = PAPER_SIZES[paperFormat];
  const margin = getMargins(paperFormat);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [paper.width, paper.height],
    compress: false
  });

  pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) doc.addPage([paper.width, paper.height], 'portrait');

    // 1. Draw the actual cards
    page.cards.forEach((card, cardIdx) => {
      if (!card) return;

      const col = cardIdx % GRID.cols;
      const row = Math.floor(cardIdx / GRID.cols);
      
      const x = (margin.left + col * (CARD.width + GRID.spacing)) * scaleX;
      const y = (margin.top + row * (CARD.height + GRID.spacing)) * scaleY;

      // In regular mode: draw solid black background for the card slot to cover white/transparent corners
      // In FOIL mode: DO NOT draw background so transparency is preserved for holographic shine!
      if (!foilMode) {
        doc.setFillColor(0, 0, 0);
        doc.rect(x, y, CARD.width * scaleX, CARD.height * scaleY, 'F');
      }

      // Format: in foilMode, use PNG format so jsPDF embeds RGBA transparency with mask/alpha channel
      const imageFormat = (foilMode || card.dataUrl.startsWith('data:image/png')) ? 'PNG' : 'JPEG';
      doc.addImage(card.dataUrl, imageFormat, x, y, CARD.width * scaleX, CARD.height * scaleY, undefined, 'FAST');
    });

    // 2. Define exact grid line coordinates
    const x0 = margin.left * scaleX;
    const x1 = (margin.left + 1 * CARD.width) * scaleX;
    const x2 = (margin.left + 2 * CARD.width) * scaleX;
    const x3 = (margin.left + 3 * CARD.width) * scaleX;
    const xs = [x0, x1, x2, x3];

    const y0 = margin.top * scaleY;
    const y1 = (margin.top + 1 * CARD.height) * scaleY;
    const y2 = (margin.top + 2 * CARD.height) * scaleY;
    const y3 = (margin.top + 3 * CARD.height) * scaleY;
    const ys = [y0, y1, y2, y3];

    // 3. Draw Inner Separation/Cutting Guides (Thin, distinct gray overlay lines between cards)
    doc.setLineWidth(0.08); // Very thin hairline
    doc.setDrawColor(160, 160, 160); // Noticeable but elegant gray overlay

    // Vertical separation lines between card boundaries
    xs.forEach(x => {
      doc.line(x, y0, x, y3);
    });

    // Horizontal separation lines between card boundaries
    ys.forEach(y => {
      doc.line(x0, y, x3, y);
    });

    // 4. Draw Outer Margin Cutting Guides (Extended from the very edge of the sheet: 0 to margin, and grid to sheet end)
    // High-visibility Crimson Red (0.3mm / ~0.85pt width) so they are immediately visible on any paper format
    doc.setLineWidth(0.3);
    doc.setDrawColor(220, 38, 38);

    // Vertical crop marks in top & bottom margins (extending from 0 to top margin, and bottom grid to full paper height)
    xs.forEach(x => {
      doc.line(x, 0, x, y0); // Top margin starting right at paper top edge (0)
      doc.line(x, y3, x, paper.height); // Bottom margin running all the way to paper bottom edge
    });

    // Horizontal crop marks in left & right margins (extending from 0 to left margin, and right grid to full paper width)
    ys.forEach(y => {
      doc.line(0, y, x0, y); // Left margin starting right at paper left edge (0)
      doc.line(x3, y, paper.width, y); // Right margin running all the way to paper right edge
    });
  });

  const filename = paperFormat === 'a4' 
    ? 'mtg-proxies-a4-layout.pdf' 
    : paperFormat === 'letter'
    ? 'mtg-proxies-carta-layout.pdf'
    : 'mtg-proxies-oficio-layout.pdf';
  doc.save(filename);
};

