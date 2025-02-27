import React, { useCallback, useState } from 'react';
import { Box, Text, Icon, Icons, Chip, Button } from 'folds';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useAccountDataCallback } from '../../../hooks/useAccountDataCallback';

type AccountDataProps = {
  expand: boolean;
  onExpandToggle: (expand: boolean) => void;
  onSelect: (type: string | null) => void;
};
export function AccountData({ expand, onExpandToggle, onSelect }: AccountDataProps) {
  const mx = useMatrixClient();
  const [accountData, setAccountData] = useState(() => Array.from(mx.store.accountData.values()));

  useAccountDataCallback(
    mx,
    useCallback(
      () => setAccountData(Array.from(mx.store.accountData.values())),
      [mx, setAccountData]
    )
  );

  return (
    <Box direction="Column" gap="100">
      <Text size="L400">Account Data</Text>
      <SequenceCard
        className={SequenceCardStyle}
        variant="SurfaceVariant"
        direction="Column"
        gap="400"
      >
        <SettingTile
          title="Global"
          description="Data stored in your global account data."
          after={
            <Button
              onClick={() => onExpandToggle(!expand)}
              variant="Secondary"
              fill="Soft"
              size="300"
              radii="300"
              outlined
              before={
                <Icon src={expand ? Icons.ChevronTop : Icons.ChevronBottom} size="100" filled />
              }
            >
              <Text size="B300">{expand ? 'Collapse' : 'Expand'}</Text>
            </Button>
          }
        />
        {expand && (
          <SettingTile>
            <Box direction="Column" gap="200">
              <Text size="L400">Types</Text>
              <Box gap="200" wrap="Wrap">
                <Chip
                  variant="Secondary"
                  fill="Soft"
                  radii="Pill"
                  before={<Icon size="50" src={Icons.Plus} />}
                  onClick={() => onSelect(null)}
                >
                  <Text size="T200" truncate>
                    Add New
                  </Text>
                </Chip>
                {accountData.map((mEvent) => (
                  <Chip
                    key={mEvent.getType()}
                    variant="Secondary"
                    fill="Soft"
                    radii="Pill"
                    onClick={() => onSelect(mEvent.getType())}
                  >
                    <Text size="T200" truncate>
                      {mEvent.getType()}
                    </Text>
                  </Chip>
                ))}
              </Box>
            </Box>
          </SettingTile>
        )}
      </SequenceCard>
    </Box>
  );
}
