import React, { useState } from 'react';
import { Box, Icon, IconButton, Icons, Scroll, Text } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { Powers } from './Powers';
import { useRoom } from '../../../hooks/useRoom';
import { usePowerLevels, usePowerLevelsAPI } from '../../../hooks/usePowerLevels';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { StateEvent } from '../../../../types/matrix/room';
import { PowersEditor } from './PowersEditor';
import { PermissionGroups } from './PermissionGroups';

type PermissionsProps = {
  requestClose: () => void;
};
export function Permissions({ requestClose }: PermissionsProps) {
  const mx = useMatrixClient();
  const room = useRoom();
  const powerLevels = usePowerLevels(room);
  const { getPowerLevel, canSendStateEvent } = usePowerLevelsAPI(powerLevels);
  const canEditPowers = canSendStateEvent(
    StateEvent.PowerLevelTags,
    getPowerLevel(mx.getSafeUserId())
  );

  const [powerEditor, setPowerEditor] = useState(false);

  const handleEditPowers = () => {
    setPowerEditor(true);
  };

  if (canEditPowers && powerEditor) {
    return <PowersEditor powerLevels={powerLevels} requestClose={() => setPowerEditor(false)} />;
  }

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Permissions
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Powers
                powerLevels={powerLevels}
                onEdit={canEditPowers ? handleEditPowers : undefined}
              />
              <PermissionGroups powerLevels={powerLevels} />
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
