import React, { useCallback } from 'react';
import { IconButton, Icon, Icons, Tooltip, TooltipProvider, Text, Spinner } from 'folds';
import classNames from 'classnames';

import * as css from './VoiceChannel.css';
import { useVoiceConnection, useVoiceChannelSettings } from '../../state/hooks/voiceChannel';

type VoiceChannelButtonProps = {
  roomId: string;
  roomName: string;
};

export function VoiceChannelButton({ roomId, roomName }: VoiceChannelButtonProps) {
  const { isConnected, isConnecting, roomId: connectedRoomId, connect, disconnect } = useVoiceConnection();
  const [settings] = useVoiceChannelSettings();

  const isConnectedToThisRoom = isConnected && connectedRoomId === roomId;
  const isConnectedToOtherRoom = isConnected && connectedRoomId !== roomId;

  const handleClick = useCallback(() => {
    if (isConnectedToThisRoom) {
      disconnect();
    } else if (isConnectedToOtherRoom) {
      disconnect();
      setTimeout(() => connect(roomId, roomName), 100);
    } else {
      connect(roomId, roomName);
    }
  }, [isConnectedToThisRoom, isConnectedToOtherRoom, connect, disconnect, roomId, roomName]);

  // Don't show button if LiveKit not configured
  if (!settings.livekitServerUrl || !settings.livekitTokenEndpoint) {
    return null;
  }

  const getTooltipText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnectedToThisRoom) return 'Leave Voice';
    if (isConnectedToOtherRoom) return 'Switch Voice Channel';
    return 'Join Voice';
  };

  const getButtonVariant = () => {
    if (isConnectedToThisRoom) return 'Success';
    if (isConnectedToOtherRoom) return 'Secondary';
    return 'Secondary';
  };

  return (
    <TooltipProvider
      position="Bottom"
      offset={4}
      tooltip={
        <Tooltip>
          <Text>{getTooltipText()}</Text>
        </Tooltip>
      }
    >
      {(triggerRef) => (
        <IconButton
          ref={triggerRef}
          onClick={handleClick}
          disabled={isConnecting}
          variant={getButtonVariant()}
          className={classNames(css.VoiceButton, {
            [css.VoiceButtonActive]: isConnectedToThisRoom,
          })}
        >
          {isConnecting ? (
            <Spinner size="200" />
          ) : (
            <Icon
              size="400"
              src={Icons.Phone}
              className={isConnectedToThisRoom ? css.VoiceButtonActive : undefined}
            />
          )}
        </IconButton>
      )}
    </TooltipProvider>
  );
}

export default VoiceChannelButton;
