import React, { FormEventHandler, useCallback, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  Icon,
  Icons,
  Input,
  Spinner,
  Text,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  color,
  toRem,
} from 'folds';
import { Room } from 'matrix-js-sdk';
import { Preset, Visibility } from 'matrix-js-sdk';
import FocusTrap from 'focus-trap-react';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useVoiceServerProfiles } from '../../state/hooks/voiceChannel';
import {
  VOICE_INVITE_MSGTYPE,
  type VoiceInviteContent,
} from '../../state/voiceChannel';
import { addRoomIdToMDirect, getDMRoomFor, isUserId } from '../../utils/matrix';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { createRoomEncryptionState } from '../../components/create-room';
import { ICreateRoomStateEvent } from 'matrix-js-sdk';
import { stopPropagation } from '../../utils/keyboard';

type InviteVoicePromptProps = {
  room: Room;
  requestClose: () => void;
};

export function InviteVoicePrompt({ room, requestClose }: InviteVoicePromptProps) {
  const mx = useMatrixClient();
  const { getDefaultProfile } = useVoiceServerProfiles();
  const profile = getDefaultProfile();
  const roomName = room.name || room.roomId;

  const [userId, setUserId] = useState('');
  const [invalidUserId, setInvalidUserId] = useState(false);

  const [sendState, sendInvite] = useAsyncCallback<
    void,
    Error,
    [string]
  >(
    useCallback(
      async (targetUserId: string) => {
        if (!profile?.livekitServerUrl || !profile.livekitTokenEndpoint) {
          throw new Error('No voice server configured. Add one in Settings → Voice Channels.');
        }
        let dmRoom = getDMRoomFor(mx, targetUserId);
        if (!dmRoom) {
          const initialState: ICreateRoomStateEvent[] = [
            createRoomEncryptionState(),
          ];
          const result = await mx.createRoom({
            is_direct: true,
            invite: [targetUserId],
            visibility: Visibility.Private,
            preset: Preset.TrustedPrivateChat,
            initial_state: initialState,
          });
          await addRoomIdToMDirect(mx, result.room_id, targetUserId);
          dmRoom = mx.getRoom(result.room_id);
          if (!dmRoom) throw new Error('Failed to get DM room after create');
        }
        const content: VoiceInviteContent = {
          msgtype: VOICE_INVITE_MSGTYPE,
          body: `Invitation to join voice in ${roomName}. Add this server to your address book to join.`,
          server_url: profile.livekitServerUrl,
          token_endpoint: profile.livekitTokenEndpoint,
          matrix_room_id: room.roomId,
          room_name: roomName,
        };
        await mx.sendEvent(dmRoom.roomId, 'm.room.message' as any, content as any);
      },
      [mx, profile, room.roomId, roomName]
    )
  );

  const sending = sendState.status === AsyncStatus.Loading;
  const error = sendState.status === AsyncStatus.Error ? sendState.error : null;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const trimmed = userId.trim();
    setInvalidUserId(false);
    if (!trimmed) return;
    if (!isUserId(trimmed)) {
      setInvalidUserId(true);
      return;
    }
    sendInvite(trimmed).then(() => {
      setUserId('');
      requestClose();
    });
  };

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            returnFocusOnDeactivate: false,
            onDeactivate: requestClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog style={{ minWidth: toRem(320), maxWidth: toRem(400) }}>
            <Box as="form" onSubmit={handleSubmit} direction="Column" gap="400">
          <Box alignItems="Center" justifyContent="SpaceBetween">
            <Text size="H5">Invite to voice</Text>
            <Button
              variant="Surface"
              fill="None"
              size="300"
              radii="300"
              onClick={requestClose}
              after={<Icon src={Icons.Cross} size="100" />}
            >
              <Text size="T300">Close</Text>
            </Button>
          </Box>
          <Text size="T300" priority="400">
            Send a voice server invite to a user via DM. They can add it to their address book and join the same voice channel.
          </Text>
          <Box direction="Column" gap="100">
            <Text size="L400">User ID</Text>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="@username:server"
              variant="SurfaceVariant"
              size="500"
              radii="400"
              disabled={sending}
              autoComplete="off"
            />
            {invalidUserId && (
              <Box alignItems="Center" gap="100" style={{ color: color.Critical.Main }}>
                <Icon src={Icons.Warning} size="100" />
                <Text size="T200">Enter a valid Matrix user ID</Text>
              </Box>
            )}
            {error && (
              <Box alignItems="Center" gap="100" style={{ color: color.Critical.Main }}>
                <Icon src={Icons.Warning} size="100" />
                <Text size="T200">{error.message}</Text>
              </Box>
            )}
          </Box>
          <Box gap="200" justifyContent="End">
            <Button
              type="button"
              variant="Secondary"
              size="300"
              radii="300"
              onClick={requestClose}
            >
              <Text size="B300">Cancel</Text>
            </Button>
            <Button
              type="submit"
              variant="Primary"
              size="300"
              radii="300"
              disabled={sending || !userId.trim()}
              before={sending ? <Spinner variant="Primary" fill="Solid" size="200" /> : undefined}
            >
              <Text size="B300">{sending ? 'Sending…' : 'Send invite'}</Text>
            </Button>
          </Box>
            </Box>
          </Dialog>
          </FocusTrap>
        </OverlayCenter>
    </Overlay>
  );
}
