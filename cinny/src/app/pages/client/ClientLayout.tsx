import React, { ReactNode } from 'react';
import { Box } from 'folds';
import { VoiceChannelPanelGlobal } from '../../features/voice-channel';

type ClientLayoutProps = {
  nav: ReactNode;
  children: ReactNode;
};
export function ClientLayout({ nav, children }: ClientLayoutProps) {
  return (
    <Box
      grow="Yes"
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '6px',
        gap: '6px',
      }}
    >
      {/* Icon sidebar — floats as its own panel */}
      <Box shrink="No" style={{ borderRadius: '0 12px 12px 0', overflow: 'hidden' }}>
        {nav}
      </Box>

      {/* Main content column (room list + chat) */}
      <Box grow="Yes" shrink="Yes" style={{ minHeight: 0 }}>
        {children}
      </Box>

      {/* Voice panel floats at the bottom of the room-list column, Discord-style */}
      <div
        style={{
          position: 'fixed',
          left: 88,
          bottom: 12,
          width: 244,
          zIndex: 200,
          pointerEvents: 'auto',
        }}
      >
        <VoiceChannelPanelGlobal />
      </div>
    </Box>
  );
}
