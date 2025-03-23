import { MatrixClient, Room, RoomMember } from 'matrix-js-sdk';
import { useCallback, useMemo } from 'react';
import { IPowerLevels } from './usePowerLevels';
import { useStateEvent } from './useStateEvent';
import { StateEvent } from '../../types/matrix/room';
import { IImageInfo } from '../../types/matrix/common';
import { ThemeKind } from './useTheme';
import { accessibleColor } from '../plugins/color';

export type PowerLevelTagIcon = {
  key?: string;
  info?: IImageInfo;
};
export type PowerLevelTag = {
  name: string;
  color?: string;
  icon?: PowerLevelTagIcon;
};

export type PowerLevelTags = Record<number, PowerLevelTag>;

export const powerSortFn = (a: number, b: number) => b - a;
export const sortPowers = (powers: number[]): number[] => powers.sort(powerSortFn);

export const getPowers = (tags: PowerLevelTags): number[] => {
  const powers: number[] = Object.keys(tags).map((p) => parseInt(p, 10));

  return sortPowers(powers);
};

export const getUsedPowers = (powerLevels: IPowerLevels): Set<number> => {
  const powers: Set<number> = new Set();

  const findAndAddPower = (data: Record<string, unknown>) => {
    Object.keys(data).forEach((key) => {
      const powerOrAny: unknown = data[key];

      if (typeof powerOrAny === 'number') {
        powers.add(powerOrAny);
        return;
      }
      if (powerOrAny && typeof powerOrAny === 'object') {
        findAndAddPower(powerOrAny as Record<string, unknown>);
      }
    });
  };

  findAndAddPower(powerLevels);

  return powers;
};

const DEFAULT_TAGS: PowerLevelTags = {
  9001: {
    name: 'Goku',
    color: '#ff6a00',
  },
  102: {
    name: 'Goku Reborn',
    color: '#ff6a7f',
  },
  101: {
    name: 'Founder',
    color: '#0000ff',
  },
  100: {
    name: 'Admin',
    color: '#0088ff',
  },
  50: {
    name: 'Moderator',
    color: '#1fd81f',
  },
  0: {
    name: 'Member',
    color: '#91cfdf',
  },
  [-1]: {
    name: 'Muted',
    color: '#888888',
  },
};

const generateFallbackTag = (powerLevelTags: PowerLevelTags, power: number): PowerLevelTag => {
  const highToLow = sortPowers(getPowers(powerLevelTags));

  const tagPower = highToLow.find((p) => p < power);
  const tag = typeof tagPower === 'number' ? powerLevelTags[tagPower] : undefined;

  return {
    name: tag ? `${tag.name} ${power}` : `Team ${power}`,
  };
};

export type GetPowerLevelTag = (powerLevel: number) => PowerLevelTag;

export const usePowerLevelTags = (
  room: Room,
  powerLevels: IPowerLevels
): [PowerLevelTags, GetPowerLevelTag] => {
  const tagsEvent = useStateEvent(room, StateEvent.PowerLevelTags);

  const powerLevelTags: PowerLevelTags = useMemo(() => {
    const content = tagsEvent?.getContent<PowerLevelTags>();
    const powerToTags: PowerLevelTags = { ...content };

    const powers = getUsedPowers(powerLevels);
    Array.from(powers).forEach((power) => {
      if (powerToTags[power]?.name === undefined) {
        powerToTags[power] = DEFAULT_TAGS[power] ?? generateFallbackTag(DEFAULT_TAGS, power);
      }
    });

    return powerToTags;
  }, [powerLevels, tagsEvent]);

  const getTag: GetPowerLevelTag = useCallback(
    (power) => {
      const tag: PowerLevelTag | undefined = powerLevelTags[power];
      return tag ?? generateFallbackTag(DEFAULT_TAGS, power);
    },
    [powerLevelTags]
  );

  return [powerLevelTags, getTag];
};

export const useFlattenPowerLevelTagMembers = (
  members: RoomMember[],
  getPowerLevel: (userId: string) => number,
  getTag: GetPowerLevelTag
): Array<PowerLevelTag | RoomMember> => {
  const PLTagOrRoomMember = useMemo(() => {
    let prevTag: PowerLevelTag | undefined;
    const tagOrMember: Array<PowerLevelTag | RoomMember> = [];
    members.forEach((member) => {
      const memberPL = getPowerLevel(member.userId);
      const tag = getTag(memberPL);
      if (tag !== prevTag) {
        prevTag = tag;
        tagOrMember.push(tag);
      }
      tagOrMember.push(member);
    });
    return tagOrMember;
  }, [members, getTag, getPowerLevel]);

  return PLTagOrRoomMember;
};

export const getTagIconSrc = (
  mx: MatrixClient,
  useAuthentication: boolean,
  icon: PowerLevelTagIcon
): string | undefined =>
  icon?.key?.startsWith('mxc://')
    ? mx.mxcUrlToHttp(icon.key, 96, 96, 'scale', undefined, undefined, useAuthentication) ?? '🌻'
    : icon?.key;

export const useAccessibleTagColors = (
  themeKind: ThemeKind,
  powerLevelTags: PowerLevelTags
): Map<string, string> => {
  const accessibleColors: Map<string, string> = useMemo(() => {
    const colors: Map<string, string> = new Map();

    getPowers(powerLevelTags).forEach((power) => {
      const tag = powerLevelTags[power];
      const { color } = tag;
      if (!color) return;

      colors.set(color, accessibleColor(themeKind, color));
    });

    return colors;
  }, [powerLevelTags, themeKind]);

  return accessibleColors;
};
