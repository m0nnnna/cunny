import React from 'react';
import { Box, color, Spinner, Switch, Text } from 'folds';
import { MatrixError } from 'matrix-js-sdk';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../../room-settings/styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { useRoom } from '../../../hooks/useRoom';
import { useRoomDirectoryVisibility } from '../../../hooks/useRoomDirectoryVisibility';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { IPowerLevels, powerLevelAPI } from '../../../hooks/usePowerLevels';
import { StateEvent } from '../../../../types/matrix/room';
import { useMatrixClient } from '../../../hooks/useMatrixClient';

type RoomPublishProps = {
  powerLevels: IPowerLevels;
};
export function RoomPublish({ powerLevels }: RoomPublishProps) {
  const mx = useMatrixClient();
  const room = useRoom();
  const userPowerLevel = powerLevelAPI.getPowerLevel(powerLevels, mx.getSafeUserId());
  const canEditCanonical = powerLevelAPI.canSendStateEvent(
    powerLevels,
    StateEvent.RoomCanonicalAlias,
    userPowerLevel
  );

  const { visibilityState, setVisibility } = useRoomDirectoryVisibility(room.roomId);

  const [toggleState, toggleVisibility] = useAsyncCallback(setVisibility);

  const loading =
    visibilityState.status === AsyncStatus.Loading || toggleState.status === AsyncStatus.Loading;

  return (
    <SequenceCard
      className={SequenceCardStyle}
      variant="SurfaceVariant"
      direction="Column"
      gap="400"
    >
      <SettingTile
        title="Publish To Directory"
        after={
          <Box gap="200" alignItems="Center">
            {loading && <Spinner variant="Secondary" />}
            {!loading && visibilityState.status === AsyncStatus.Success && (
              <Switch
                value={visibilityState.data}
                onChange={toggleVisibility}
                disabled={!canEditCanonical}
              />
            )}
          </Box>
        }
      >
        {visibilityState.status === AsyncStatus.Error && (
          <Text style={{ color: color.Critical.Main }} size="T200">
            {(visibilityState.error as MatrixError).message}
          </Text>
        )}

        {toggleState.status === AsyncStatus.Error && (
          <Text style={{ color: color.Critical.Main }} size="T200">
            {(toggleState.error as MatrixError).message}
          </Text>
        )}
      </SettingTile>
    </SequenceCard>
  );
}
