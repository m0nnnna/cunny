import React, { ReactNode } from 'react';
import { Box } from 'folds';
import { VoiceChannelPanelGlobal } from '../../features/voice-channel';
import { VoiceParticipantsPoller } from '../../state/hooks/voiceChannel';

type ClientLayoutProps = {
  nav: ReactNode;
  children: ReactNode;
};
export function ClientLayout({ nav, children }: ClientLayoutProps) {
  return (
    <Box grow="Yes">
      <VoiceParticipantsPoller />
      <Box shrink="No">{nav}</Box>
      <Box grow="Yes" style={{ minHeight: 0 }} direction="Column">
        <Box grow="Yes" style={{ minHeight: 0 }} shrink="Yes">
          {children}
        </Box>
        <VoiceChannelPanelGlobal />
      </Box>
    </Box>
  );
}
