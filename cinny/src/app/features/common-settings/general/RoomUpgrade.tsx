import React, { FormEventHandler, useCallback, useState } from 'react';
import {
  Button,
  color,
  Spinner,
  Text,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Dialog,
  Header,
  config,
  Box,
  IconButton,
  Icon,
  Icons,
  Input,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { MatrixError } from 'matrix-js-sdk';
import { RoomCreateEventContent, RoomTombstoneEventContent } from 'matrix-js-sdk/lib/types';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../../room-settings/styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { useRoom } from '../../../hooks/useRoom';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { IPowerLevels, powerLevelAPI } from '../../../hooks/usePowerLevels';
import { StateEvent } from '../../../../types/matrix/room';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useStateEvent } from '../../../hooks/useStateEvent';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { stopPropagation } from '../../../utils/keyboard';

type RoomUpgradeProps = {
  powerLevels: IPowerLevels;
  requestClose: () => void;
};
export function RoomUpgrade({ powerLevels, requestClose }: RoomUpgradeProps) {
  const mx = useMatrixClient();
  const room = useRoom();
  const { navigateRoom, navigateSpace } = useRoomNavigate();
  const createContent = useStateEvent(
    room,
    StateEvent.RoomCreate
  )?.getContent<RoomCreateEventContent>();
  const roomVersion = createContent?.room_version ?? 1;
  const predecessorRoomId = createContent?.predecessor?.room_id;

  const capabilities = useCapabilities();
  const defaultRoomVersion = capabilities['m.room_versions']?.default;

  const tombstoneContent = useStateEvent(
    room,
    StateEvent.RoomTombstone
  )?.getContent<RoomTombstoneEventContent>();
  const replacementRoom = tombstoneContent?.replacement_room;

  const userPowerLevel = powerLevelAPI.getPowerLevel(powerLevels, mx.getSafeUserId());
  const canUpgrade = powerLevelAPI.canSendStateEvent(
    powerLevels,
    StateEvent.RoomTombstone,
    userPowerLevel
  );

  const handleOpenRoom = () => {
    if (replacementRoom) {
      requestClose();
      if (room.isSpaceRoom()) {
        navigateSpace(replacementRoom);
      } else {
        navigateRoom(replacementRoom);
      }
    }
  };

  const handleOpenOldRoom = () => {
    if (predecessorRoomId) {
      requestClose();
      if (room.isSpaceRoom()) {
        navigateSpace(predecessorRoomId);
      } else {
        navigateRoom(predecessorRoomId, createContent.predecessor?.event_id);
      }
    }
  };

  const [upgradeState, upgrade] = useAsyncCallback(
    useCallback(
      async (version: string) => {
        await mx.upgradeRoom(room.roomId, version);
      },
      [mx, room]
    )
  );

  const upgrading = upgradeState.status === AsyncStatus.Loading;

  const [prompt, setPrompt] = useState(false);

  const handleSubmitUpgrade: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();

    const target = evt.target as HTMLFormElement | undefined;
    const versionInput = target?.versionInput as HTMLInputElement | undefined;
    const version = versionInput?.value.trim();
    if (!version) return;

    upgrade(version);
    setPrompt(false);
  };

  return (
    <SequenceCard
      className={SequenceCardStyle}
      variant="SurfaceVariant"
      direction="Column"
      gap="400"
    >
      <SettingTile
        title={room.isSpaceRoom() ? 'Upgrade Space' : 'Upgrade Room'}
        description={
          replacementRoom
            ? tombstoneContent.body ||
              `This ${room.isSpaceRoom() ? 'space' : 'room'} has been replaced!`
            : `Current room version: ${roomVersion}.`
        }
        after={
          <Box alignItems="Center" gap="200">
            {predecessorRoomId && (
              <Button
                size="300"
                variant="Secondary"
                fill="Soft"
                outlined
                radii="300"
                onClick={handleOpenOldRoom}
              >
                <Text size="B300">{room.isSpaceRoom() ? 'Old Space' : 'Old Room'}</Text>
              </Button>
            )}
            {replacementRoom ? (
              <Button
                size="300"
                variant="Success"
                fill="Solid"
                radii="300"
                onClick={handleOpenRoom}
              >
                <Text size="B300">{room.isSpaceRoom() ? 'Open New Space' : 'Open New Room'}</Text>
              </Button>
            ) : (
              <Button
                size="300"
                variant="Secondary"
                fill="Solid"
                radii="300"
                disabled={upgrading || !canUpgrade}
                before={upgrading && <Spinner size="100" variant="Secondary" fill="Solid" />}
                onClick={() => setPrompt(true)}
              >
                <Text size="B300">Upgrade</Text>
              </Button>
            )}
          </Box>
        }
      >
        {upgradeState.status === AsyncStatus.Error && (
          <Text style={{ color: color.Critical.Main }} size="T200">
            {(upgradeState.error as MatrixError).message}
          </Text>
        )}

        {prompt && (
          <Overlay open backdrop={<OverlayBackdrop />}>
            <OverlayCenter>
              <FocusTrap
                focusTrapOptions={{
                  initialFocus: false,
                  onDeactivate: () => setPrompt(false),
                  clickOutsideDeactivates: true,
                  escapeDeactivates: stopPropagation,
                }}
              >
                <Dialog variant="Surface" as="form" onSubmit={handleSubmitUpgrade}>
                  <Header
                    style={{
                      padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                      borderBottomWidth: config.borderWidth.B300,
                    }}
                    variant="Surface"
                    size="500"
                  >
                    <Box grow="Yes">
                      <Text size="H4">{room.isSpaceRoom() ? 'Space Upgrade' : 'Room Upgrade'}</Text>
                    </Box>
                    <IconButton size="300" onClick={() => setPrompt(false)} radii="300">
                      <Icon src={Icons.Cross} />
                    </IconButton>
                  </Header>
                  <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
                    <Text priority="400" style={{ color: color.Critical.Main }}>
                      <b>This action is irreversible!</b>
                    </Text>
                    <Box direction="Column" gap="100">
                      <Text size="L400">Version</Text>
                      <Input
                        defaultValue={defaultRoomVersion}
                        name="versionInput"
                        variant="Background"
                        required
                      />
                    </Box>
                    <Button type="submit" variant="Secondary">
                      <Text size="B400">
                        {room.isSpaceRoom() ? 'Upgrade Space' : 'Upgrade Room'}
                      </Text>
                    </Button>
                  </Box>
                </Dialog>
              </FocusTrap>
            </OverlayCenter>
          </Overlay>
        )}
      </SettingTile>
    </SequenceCard>
  );
}
