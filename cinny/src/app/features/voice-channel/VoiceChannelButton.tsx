import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  config,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  PopOut,
  Spinner,
  Text,
  Tooltip,
  TooltipProvider,
} from 'folds';
import classNames from 'classnames';
import { useAtomValue } from 'jotai';

import * as css from './VoiceChannel.css';
import { useVoiceConnection, useVoiceChannelSettings } from '../../state/hooks/voiceChannel';
import {
  voiceServerProfilesAtom,
  defaultVoiceServerProfileIdAtom,
} from '../../state/voiceChannel';

type VoiceChannelButtonProps = {
  roomId: string;
  roomName: string;
};

export function VoiceChannelButton({ roomId, roomName }: VoiceChannelButtonProps) {
  const { isConnected, isConnecting, roomId: connectedRoomId, connect, disconnect } =
    useVoiceConnection();
  const [settings] = useVoiceChannelSettings();
  const profiles = useAtomValue(voiceServerProfilesAtom);
  const defaultProfileId = useAtomValue(defaultVoiceServerProfileIdAtom);

  const [menuAnchor, setMenuAnchor] = useState<DOMRect | undefined>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isConnectedToThisRoom = isConnected && connectedRoomId === roomId;
  const isConnectedToOtherRoom = isConnected && connectedRoomId !== roomId;

  const hasServer =
    profiles.length > 0 ||
    !!(settings.livekitServerUrl && settings.livekitTokenEndpoint);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isConnecting) return;

      if (isConnectedToThisRoom) {
        disconnect();
        return;
      }

      if (profiles.length > 1 && !isConnectedToOtherRoom) {
        setMenuAnchor((prev) =>
          prev ? undefined : e.currentTarget.getBoundingClientRect()
        );
        return;
      }

      if (isConnectedToOtherRoom) {
        disconnect();
        setTimeout(() => connect(roomId, roomName), 100);
      } else {
        connect(roomId, roomName);
      }
    },
    [
      isConnecting,
      isConnectedToThisRoom,
      isConnectedToOtherRoom,
      profiles.length,
      connect,
      disconnect,
      roomId,
      roomName,
    ]
  );

  const handleSelectProfile = useCallback(
    (profileId: string) => {
      setMenuAnchor(undefined);
      if (isConnectedToOtherRoom) {
        disconnect();
        setTimeout(() => connect(roomId, roomName, profileId), 100);
      } else {
        connect(roomId, roomName, profileId);
      }
    },
    [isConnectedToOtherRoom, connect, disconnect, roomId, roomName]
  );

  useEffect(() => {
    if (!menuAnchor) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      const portal = document.getElementById('portalContainer');
      if (portal?.contains(target)) return;
      setMenuAnchor(undefined);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [menuAnchor]);

  if (!hasServer) return null;

  const getTooltipText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnectedToThisRoom) return 'Leave Voice';
    if (isConnectedToOtherRoom) return 'Switch Voice Channel';
    if (profiles.length > 1) return 'Join Voice (pick server)';
    return 'Join Voice';
  };

  const getButtonVariant = () => {
    if (isConnectedToThisRoom) return 'Success' as const;
    return 'Secondary' as const;
  };

  return (
    <div ref={wrapperRef} style={{ display: 'inline-flex', position: 'relative' }}>
      <PopOut
        anchor={menuAnchor}
        position="Bottom"
        align="End"
        offset={4}
        content={
          menuAnchor ? (
            <Menu variant="SurfaceVariant" style={{ minWidth: 200, maxWidth: 280 }}>
              <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
                <Text
                  size="L400"
                  style={{ padding: `${config.space.S100} ${config.space.S200}` }}
                >
                  Pick a server
                </Text>
                {profiles.map((p) => (
                  <MenuItem
                    key={p.id}
                    size="300"
                    radii="300"
                    onClick={() => handleSelectProfile(p.id)}
                  >
                    <Box direction="Column" style={{ minWidth: 0 }}>
                      <Text
                        size="T300"
                        truncate
                        style={{
                          fontWeight: p.id === defaultProfileId ? 600 : 400,
                        }}
                      >
                        {p.id === defaultProfileId ? '\u2605 ' : ''}
                        {p.name}
                      </Text>
                      <Text size="T200" priority="300" truncate>
                        {p.livekitServerUrl.replace(/^wss?:\/\//, '')}
                      </Text>
                    </Box>
                  </MenuItem>
                ))}
              </Box>
            </Menu>
          ) : null
        }
      >
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
                  className={
                    isConnectedToThisRoom ? css.VoiceButtonActive : undefined
                  }
                />
              )}
            </IconButton>
          )}
        </TooltipProvider>
      </PopOut>
    </div>
  );
}

export default VoiceChannelButton;
