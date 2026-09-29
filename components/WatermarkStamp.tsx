import React, { useEffect, useRef } from 'react';

interface WatermarkStampProps {
  opacity: number; // 10-85
  scale: number; // 60-150
}

const WatermarkStamp: React.FC<WatermarkStampProps> = ({ opacity, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get actual canvas display size from parent
    const rect = canvas.parentElement?.getBoundingClientRect();
    const cardWidth = rect?.width || 236;
    const cardHeight = rect?.height || 330;

    // Set canvas resolution to match display size (2x for crisp rendering)
    canvas.width = cardWidth * 2;
    canvas.height = cardHeight * 2;
    ctx.scale(2, 2);

    // Clear canvas
    ctx.clearRect(0, 0, cardWidth, cardHeight);

    // Watermark properties - circular seal with text forming the circle
    const radius = (cardHeight * scale) / 115; // Larger radius for 30% bigger default visibility
    const centerX = cardWidth / 2;
    const centerY = cardHeight / 2.5; // Center vertically

    // Draw circular watermark seal with text path
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = '#1E3FE0'; // Luminous Blue
    // Extra bold: use very large font with 900 weight
    const fontSize = Math.max(20, 24 * (scale / 100));
    ctx.font = `900 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text to draw in circle - with stars as separators
    const text = '★ MTG PROXY LAB ★';

    // Calculate angle spacing per character
    const totalAngle = Math.PI * 1.5; // Cover 270 degrees
    const anglePerChar = totalAngle / text.length;
    const startAngle = Math.PI / 2 + totalAngle / 2; // Start from top-left

    // Draw text along circular path with bold letters
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charAngle = startAngle - (i * anglePerChar);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(charAngle);
      // Fill with stroke for extra boldness
      ctx.fillText(char, 0, -radius);
      ctx.restore();
    }

    ctx.restore();
  }, [opacity, scale]); // Re-render when opacity/scale changes AND when container resizes

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Trigger re-render by updating canvas
        canvas.dispatchEvent(new Event('resize'));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default WatermarkStamp;
