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

    // Watermark properties - circular seal with stars
    const radius = (cardHeight * scale) / 200; // Scale-dependent radius
    const centerX = cardWidth / 2;
    const centerY = cardHeight / 3; // Upper 1/3 of card
    const starSize = (scale / 100) * 8;

    // Draw circular watermark seal
    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.strokeStyle = '#1E3FE0'; // Luminous Blue
    ctx.fillStyle = 'transparent';
    ctx.lineWidth = Math.max(1.5, scale / 50);

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();

    // Draw center text "MTG PROXY LAB"
    ctx.font = `900 ${Math.max(8, 10 * (scale / 100))}px Inter, sans-serif`;
    ctx.fillStyle = '#1E3FE0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MTG PROXY LAB', centerX, centerY);

    // Helper function to draw a star
    const drawStar = (x: number, y: number, size: number) => {
      const spikes = 5;
      const step = Math.PI / spikes;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? size : size / 2;
        const angle = i * step - Math.PI / 2;
        const sx = x + radius * Math.cos(angle);
        const sy = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    };

    // Draw stars on left and right
    ctx.fillStyle = '#1E3FE0';
    drawStar(centerX - radius * 0.5, centerY, starSize);
    drawStar(centerX + radius * 0.5, centerY, starSize);

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
