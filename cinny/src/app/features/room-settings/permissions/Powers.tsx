/* eslint-disable react/no-array-index-key */
import React, { useState, MouseEventHandler, ReactNode } from 'react';
import FocusTrap from 'focus-trap-react';
import {
  Box,
  Button,
  Chip,
  Text,
  RectCords,
  PopOut,
  Menu,
  Scroll,
  toRem,
  config,
  color,
} from 'folds';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { getPowers, getTagIconSrc, usePowerLevelTags } from '../../../hooks/usePowerLevelTags';
import { SettingTile } from '../../../components/setting-tile';
import { getPermissionPower, IPowerLevels } from '../../../hooks/usePowerLevels';
import { useRoom } from '../../../hooks/useRoom';
import { PowerColorBadge, PowerIcon } from '../../../components/power';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { stopPropagation } from '../../../utils/keyboard';
import { usePermissionGroups } from './usePermissionItems';

type PeekPermissionsProps = {
  powerLevels: IPowerLevels;
  power: number;
  children: (handleOpen: MouseEventHandler<HTMLButtonElement>, opened: boolean) => ReactNode;
};
function PeekPermissions({ powerLevels, power, children }: PeekPermissionsProps) {
  const [menuCords, setMenuCords] = useState<RectCords>();
  const permissionGroups = usePermissionGroups();

  const handleOpen: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setMenuCords(evt.currentTarget.getBoundingClientRect());
  };

  return (
    <PopOut
      anchor={menuCords}
      offset={5}
      position="Bottom"
      align="Center"
      content={
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: () => setMenuCords(undefined),
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Menu
            style={{
              maxHeight: '75vh',
              maxWidth: toRem(300),
              display: 'flex',
            }}
          >
            <Box grow="Yes" tabIndex={0}>
              <Scroll size="0" hideTrack visibility="Hover">
                <Box style={{ padding: config.space.S200 }} direction="Column" gap="400">
                  {permissionGroups.map((group, groupIndex) => (
                    <Box key={groupIndex} direction="Column" gap="100">
                      <Text size="L400">{group.name}</Text>
                      <div>
                        {group.items.map((item, itemIndex) => {
                          const requiredPower = getPermissionPower(powerLevels, item.location);
                          const hasPower = requiredPower <= power;

                          return (
                            <Text
                              key={itemIndex}
                              size="T200"
                              style={{
                                color: hasPower ? undefined : color.Critical.Main,
                              }}
                            >
                              {hasPower ? '✅' : '❌'} {item.name}
                            </Text>
                          );
                        })}
                      </div>
                    </Box>
                  ))}
                </Box>
              </Scroll>
            </Box>
          </Menu>
        </FocusTrap>
      }
    >
      {children(handleOpen, !!menuCords)}
    </PopOut>
  );
}

type PowersProps = {
  powerLevels: IPowerLevels;
  onEdit?: () => void;
};
export function Powers({ powerLevels, onEdit }: PowersProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const room = useRoom();
  const [powerLevelTags] = usePowerLevelTags(room, powerLevels);

  return (
    <Box direction="Column" gap="100">
      <SequenceCard
        variant="SurfaceVariant"
        className={SequenceCardStyle}
        direction="Column"
        gap="400"
      >
        <SettingTile
          title="Power Levels"
          description="Manage and customize incremental power levels for users."
          after={
            onEdit && (
              <Box gap="200">
                <Button
                  variant="Secondary"
                  fill="Soft"
                  size="300"
                  radii="300"
                  outlined
                  onClick={onEdit}
                >
                  <Text size="B300">Edit</Text>
                </Button>
              </Box>
            )
          }
        />
        <SettingTile>
          <Box gap="200" wrap="Wrap">
            {getPowers(powerLevelTags).map((power) => {
              const tag = powerLevelTags[power];
              const tagIconSrc = tag.icon && getTagIconSrc(mx, useAuthentication, tag.icon);

              return (
                <PeekPermissions key={power} powerLevels={powerLevels} power={power}>
                  {(openMenu, opened) => (
                    <Chip
                      onClick={openMenu}
                      variant="Secondary"
                      aria-pressed={opened}
                      radii="300"
                      before={<PowerColorBadge color={tag.color} />}
                      after={tagIconSrc && <PowerIcon size="50" iconSrc={tagIconSrc} />}
                    >
                      <Text size="T300" truncate>
                        <b>{tag.name}</b>
                      </Text>
                    </Chip>
                  )}
                </PeekPermissions>
              );
            })}
          </Box>
        </SettingTile>
      </SequenceCard>
    </Box>
  );
}
