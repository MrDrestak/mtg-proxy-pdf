import React from 'react';

interface WatermarkStampProps {
  opacity: number; // 10-85
  scale: number; // 60-150
}

const WatermarkStamp: React.FC<WatermarkStampProps> = ({ opacity, scale }) => {
  // Scale the badge size (base 60px, scales from 60-150%)
  const badgeSize = Math.max(30, 60 * (scale / 100));
  const opacityDecimal = opacity / 100;

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      style={{ opacity: opacityDecimal }}
    >
      <svg
        width={badgeSize}
        height={badgeSize}
        viewBox="0 0 120 120"
        className="drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      >
        {/* Outer hexagon gradient background */}
        <defs>
          <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1E3FE0', stopOpacity: 0.95 }} />
            <stop offset="100%" style={{ stopColor: '#0F2AA8', stopOpacity: 0.95 }} />
          </linearGradient>
          <filter id="innerGlow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Hexagon outer shape */}
        <polygon
          points="60,10 105,35 105,85 60,110 15,85 15,35"
          fill="url(#badgeGradient)"
          stroke="#00D9FF"
          strokeWidth="1.5"
          filter="url(#innerGlow)"
        />

        {/* Top star */}
        <text
          x="60"
          y="28"
          fontSize="18"
          fontWeight="900"
          textAnchor="middle"
          fill="#00D9FF"
          fontFamily="Arial, sans-serif"
        >
          ★
        </text>

        {/* MTG text - top */}
        <text
          x="60"
          y="48"
          fontSize="13"
          fontWeight="900"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
        >
          MTG
        </text>

        {/* PROXY text - middle */}
        <text
          x="60"
          y="65"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          fill="#00D9FF"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
        >
          PROXY
        </text>

        {/* LAB text - bottom */}
        <text
          x="60"
          y="82"
          fontSize="13"
          fontWeight="900"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
        >
          LAB
        </text>

        {/* Bottom star */}
        <text
          x="60"
          y="98"
          fontSize="18"
          fontWeight="900"
          textAnchor="middle"
          fill="#00D9FF"
          fontFamily="Arial, sans-serif"
        >
          ★
        </text>

        {/* Inner accent lines */}
        <line x1="30" y1="60" x2="50" y2="60" stroke="#00D9FF" strokeWidth="0.8" opacity="0.6" />
        <line x1="70" y1="60" x2="90" y2="60" stroke="#00D9FF" strokeWidth="0.8" opacity="0.6" />
      </svg>
    </div>
  );
};

export default WatermarkStamp;
