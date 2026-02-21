import React, { useMemo, useState, useEffect } from 'react';
import { isNekoThemeId, useTheme } from '../../hooks/useTheme';
import { useClientConfig } from '../../hooks/useClientConfig';

const POSITIONS: ReadonlyArray<{
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  transform: string;
}> = [
  { top: 20, left: 20, transform: 'scale(1)' },
  { top: 20, right: 20, transform: 'scale(-1, 1)' },
  { bottom: 88, left: 20, transform: 'scale(1, -1)' },
  { bottom: 88, right: 20, transform: 'scale(-1, -1)' },
];

/**
 * Cute neko cat-girl mascot silhouette. Only visible in Neko themes when enabled in config.
 * Drawn with a clear outline (stroke) so it reads as a cat girl (ears, head, bow, shoulders).
 */
export function NekoMascot() {
  const theme = useTheme();
  const config = useClientConfig();
  const mascotEnabled = config.showNekoMascot !== false;
  const isNeko = isNekoThemeId(theme.id) && mascotEnabled;

  const [visible, setVisible] = useState(false);
  const position = useMemo(
    () => POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
    []
  );

  useEffect(() => {
    if (!isNeko) return;
    const delay = 800 + Math.random() * 1200;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [isNeko]);

  if (!isNeko || !visible) return null;

  const isDark =
    theme.id === 'neko-dark-theme' ||
    theme.id === 'neko-sunset-theme' ||
    theme.id === 'neko-cyberpunk-theme' ||
    theme.id === 'neko-solarized-theme';
  const fill = isDark ? 'rgba(24, 22, 32, 0.65)' : 'rgba(55, 48, 68, 0.5)';
  const stroke = isDark ? 'rgba(24, 22, 32, 0.85)' : 'rgba(45, 42, 54, 0.75)';

  const { transform, ...place } = position;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        width: 140,
        height: 160,
        ...place,
        pointerEvents: 'none',
        zIndex: 9998,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease-out',
        transform,
      }}
    >
      <svg
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <g
          fill={fill}
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {/* Head + ears: single outline so silhouette is clear */}
          <path
            fillRule="evenodd"
            d="M 60 22
               L 32 36 L 20 8 L 28 42
               L 30 58 Q 28 78 60 86 Q 92 78 90 58 L 92 42 L 100 8 L 88 36 Z"
          />
          {/* Bow: left loop */}
          <ellipse
            cx="48"
            cy="32"
            rx="10"
            ry="6"
            transform="rotate(-22 48 32)"
          />
          {/* Bow: right loop */}
          <ellipse
            cx="72"
            cy="32"
            rx="10"
            ry="6"
            transform="rotate(22 72 32)"
          />
          {/* Bow: center knot */}
          <circle cx="60" cy="34" r="4" />
          {/* Shoulders / body */}
          <path d="M 26 90 Q 60 108 94 90 L 90 98 Q 60 110 30 98 Z" />
        </g>
      </svg>
    </div>
  );
}
