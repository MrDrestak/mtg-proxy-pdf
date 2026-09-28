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

    // Card dimensions in pixels (63mm × 88mm at 96 DPI ≈ 236px × 330px)
    const cardWidth = 236;
    const cardHeight = 330;

    canvas.width = cardWidth;
    canvas.height = cardHeight;

    // Clear canvas
    ctx.clearRect(0, 0, cardWidth, cardHeight);

    // Watermark properties
    const text = 'MTG PROXY LABS • ART GALLERY •';
    const radius = (cardHeight * scale) / 200; // Scale-dependent radius
    const centerX = cardWidth / 2;
    const centerY = cardHeight / 3; // Upper 1/3 of card

    // Draw circular watermark with text
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = '#1E3FE0'; // Luminous Blue
    ctx.strokeStyle = '#1E3FE0';
    ctx.lineWidth = 2;

    // Draw circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw text in circular path
    ctx.font = `bold ${12 * (scale / 100)}px Inter, sans-serif`;
    ctx.fillStyle = '#1E3FE0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text along arc
    const textWidth = ctx.measureText(text).width;
    const angle = textWidth / radius;
    const startAngle = Math.PI / 2;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charAngle = startAngle - (i * angle) / text.length;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(charAngle);
      ctx.fillText(char, 0, -radius);
      ctx.restore();
    }

    // Draw center text
    ctx.font = `900 ${14 * (scale / 100)}px Inter, sans-serif`;
    ctx.fillText('PROTECTED', centerX, centerY);

    ctx.restore();
  }, [opacity, scale]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default WatermarkStamp;
