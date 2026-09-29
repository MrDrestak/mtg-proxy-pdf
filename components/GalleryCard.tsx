import React, { useRef, useState } from 'react';
import { CardImage } from '../types';
import CardPreview from './CardPreview';

interface GalleryCardProps {
  card: CardImage;
  onClick?: () => void;
  showWatermark?: boolean;
  watermarkOpacity?: number;
  watermarkScale?: number;
}

const GalleryCard: React.FC<GalleryCardProps> = ({
  card,
  onClick,
  showWatermark = true,
  watermarkOpacity = 35,
  watermarkScale = 100,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Tilt effect: -10 to 10 degrees based on mouse position
    const tiltX = ((y - centerY) / centerY) * 10;
    const tiltY = ((x - centerX) / centerX) * -10;
    setTilt({ x: tiltX, y: tiltY });

    // Panning motion: subtle movement following mouse (Swiss Clean style)
    const panX = ((x - centerX) / centerX) * 8;
    const panY = ((y - centerY) / centerY) * 8;
    setPan({ x: panX, y: panY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setPan({ x: 0, y: 0 });
    setIsHovering(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer perspective h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovering(true)}
      onClick={onClick}
      style={{
        perspective: '1000px',
      }}
    >
      {/* Card Container with Tilt Effect */}
      <div
        style={{
          transform: `
            rotateX(${tilt.x}deg)
            rotateY(${tilt.y}deg)
            scale(${isHovering ? 1.05 : 1})
            translateX(${pan.x}px)
            translateY(${pan.y}px)
          `,
          transformStyle: 'preserve-3d',
          transition: isHovering ? 'none' : 'transform 0.5s cubic-bezier(0.23, 1, 0.320, 1)',
        }}
        className={`h-full ${isHovering ? 'shadow-2xl shadow-blue-500/40' : 'shadow-lg'}`}
      >
        <CardPreview
          card={card}
          showWatermark={showWatermark}
          watermarkOpacity={watermarkOpacity}
          watermarkScale={watermarkScale}
          fillContainer={true}
        />
      </div>

      {/* Shine Effect on Hover (subtle gradient overlay) */}
      {isHovering && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,212,255,0.1) 100%)',
            animation: 'shimmer 2s infinite',
          }}
        />
      )}

      {/* CSS Animation for Shimmer */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default GalleryCard;
