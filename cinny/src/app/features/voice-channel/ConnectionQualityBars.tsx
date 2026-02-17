import React from 'react';
import { ConnectionQuality } from 'livekit-client';

type ConnectionQualityBarsProps = {
  quality: ConnectionQuality;
  size?: number;
};

const QUALITY_COLORS: Record<ConnectionQuality, string> = {
  [ConnectionQuality.Excellent]: 'var(--mx-SuccessMain, #43b581)',
  [ConnectionQuality.Good]: 'var(--mx-SuccessMain, #43b581)',
  [ConnectionQuality.Poor]: 'var(--mx-WarningMain, #faa61a)',
  [ConnectionQuality.Lost]: 'var(--mx-CriticalMain, #f04747)',
  [ConnectionQuality.Unknown]: 'var(--mx-OnBackgroundMuted, #72767d)',
};

const QUALITY_BARS: Record<ConnectionQuality, number> = {
  [ConnectionQuality.Excellent]: 4,
  [ConnectionQuality.Good]: 3,
  [ConnectionQuality.Poor]: 2,
  [ConnectionQuality.Lost]: 1,
  [ConnectionQuality.Unknown]: 0,
};

const QUALITY_LABELS: Record<ConnectionQuality, string> = {
  [ConnectionQuality.Excellent]: 'Excellent connection',
  [ConnectionQuality.Good]: 'Good connection',
  [ConnectionQuality.Poor]: 'Poor connection',
  [ConnectionQuality.Lost]: 'Connection lost',
  [ConnectionQuality.Unknown]: 'Connection quality unknown',
};

/**
 * Signal-strength bars icon (4 bars). Bars light up based on ConnectionQuality.
 */
export function ConnectionQualityBars({ quality, size = 14 }: ConnectionQualityBarsProps) {
  const activeBars = QUALITY_BARS[quality] ?? 0;
  const color = QUALITY_COLORS[quality] ?? QUALITY_COLORS[ConnectionQuality.Unknown];
  const label = QUALITY_LABELS[quality] ?? 'Unknown';
  const totalBars = 4;
  const barWidth = size / 6;
  const barGap = barWidth * 0.6;
  const totalWidth = totalBars * barWidth + (totalBars - 1) * barGap;

  return (
    <svg
      width={totalWidth}
      height={size}
      viewBox={`0 0 ${totalWidth} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={label}
      title={label}
      style={{ flexShrink: 0 }}
    >
      {Array.from({ length: totalBars }, (_, i) => {
        const barHeight = ((i + 1) / totalBars) * size;
        const x = i * (barWidth + barGap);
        const y = size - barHeight;
        const isActive = i < activeBars;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={barWidth / 4}
            fill={isActive ? color : 'currentColor'}
            opacity={isActive ? 1 : 0.2}
          />
        );
      })}
    </svg>
  );
}
