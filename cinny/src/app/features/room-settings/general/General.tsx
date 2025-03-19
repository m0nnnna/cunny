import React from 'react';
import { Box, Icon, IconButton, Icons, Scroll, Text } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { RoomProfile } from './RoomProfile';
import { usePowerLevels } from '../../../hooks/usePowerLevels';
import { useRoom } from '../../../hooks/useRoom';
import { RoomEncryption } from './RoomEncryption';
import { RoomHistoryVisibility } from './RoomHistoryVisibility';
import { RoomJoinRules } from './RoomJoinRules';
import { RoomLocalAddresses, RoomPublishedAddresses } from './RoomAddress';

type GeneralProps = {
  requestClose: () => void;
};
export function General({ requestClose }: GeneralProps) {
  const room = useRoom();
  const powerLevels = usePowerLevels(room);

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              General
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
              <RoomProfile powerLevels={powerLevels} />
              <Box direction="Column" gap="100">
                <Text size="L400">Options</Text>
                <RoomJoinRules powerLevels={powerLevels} />
                <RoomHistoryVisibility powerLevels={powerLevels} />
                <RoomEncryption powerLevels={powerLevels} />
              </Box>
              <Box direction="Column" gap="100">
                <Text size="L400">Addresses</Text>
                <RoomPublishedAddresses powerLevels={powerLevels} />
                <RoomLocalAddresses powerLevels={powerLevels} />
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
