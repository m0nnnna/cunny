import React, { ReactNode } from 'react';
import { Box } from 'folds';
import { VoiceChannelPanelGlobal } from '../../features/voice-channel';

type ClientLayoutProps = {
  nav: ReactNode;
  children: ReactNode;
};
export function ClientLayout({ nav, children }: ClientLayoutProps) {
  return (
    <Box grow="Yes" style={{ position: 'relative', zIndex: 1 }}>
      <Box shrink="No">{nav}</Box>
      <Box grow="Yes" style={{ minHeight: 0 }} shrink="Yes" direction="Column">
        <Box grow="Yes" style={{ minHeight: 0 }} shrink="Yes">
          {children}
        </Box>
        <VoiceChannelPanelGlobal />
      </Box>
    </Box>
  );
}
