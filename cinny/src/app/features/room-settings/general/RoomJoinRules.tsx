import React, { useCallback, useMemo } from 'react';
import { color, Text } from 'folds';
import { JoinRule, MatrixError, RestrictedAllowType } from 'matrix-js-sdk';
import { RoomJoinRulesEventContent } from 'matrix-js-sdk/lib/types';
import { IPowerLevels, powerLevelAPI } from '../../../hooks/usePowerLevels';
import {
  JoinRulesSwitcher,
  useRoomJoinRuleIcon,
  useRoomJoinRuleLabel,
} from '../../../components/JoinRulesSwitcher';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useRoom } from '../../../hooks/useRoom';
import { StateEvent } from '../../../../types/matrix/room';
import { useStateEvent } from '../../../hooks/useStateEvent';
import { useSpaceOptionally } from '../../../hooks/useSpace';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { getStateEvents } from '../../../utils/room';

type RestrictedRoomAllowContent = {
  room_id: string;
  type: RestrictedAllowType;
};

type RoomJoinRulesProps = {
  powerLevels: IPowerLevels;
};
export function RoomJoinRules({ powerLevels }: RoomJoinRulesProps) {
  const mx = useMatrixClient();
  const room = useRoom();
  const roomVersion = parseInt(room.getVersion(), 10);
  const allowRestricted = roomVersion >= 8;
  const allowKnock = roomVersion >= 7;
  const space = useSpaceOptionally();

  const userPowerLevel = powerLevelAPI.getPowerLevel(powerLevels, mx.getSafeUserId());
  const canEdit = powerLevelAPI.canSendStateEvent(
    powerLevels,
    StateEvent.RoomHistoryVisibility,
    userPowerLevel
  );

  const joinRuleEvent = useStateEvent(room, StateEvent.RoomJoinRules);
  const content = joinRuleEvent?.getContent<RoomJoinRulesEventContent>();
  const rule: JoinRule = content?.join_rule ?? JoinRule.Invite;

  const joinRules: Array<JoinRule> = useMemo(() => {
    const r: JoinRule[] = [JoinRule.Invite];
    if (allowKnock) {
      r.push(JoinRule.Knock);
    }
    if (allowRestricted && space) {
      r.push(JoinRule.Restricted);
    }
    r.push(JoinRule.Public);

    return r;
  }, [allowRestricted, allowKnock, space]);

  const icons = useRoomJoinRuleIcon();
  const labels = useRoomJoinRuleLabel();

  const [submitState, submit] = useAsyncCallback(
    useCallback(
      async (joinRule: JoinRule) => {
        const allow: RestrictedRoomAllowContent[] = [];
        if (joinRule === JoinRule.Restricted) {
          const parents = getStateEvents(room, StateEvent.SpaceParent).map((event) =>
            event.getStateKey()
          );
          parents.forEach((parentRoomId) => {
            if (!parentRoomId) return;
            allow.push({
              type: RestrictedAllowType.RoomMembership,
              room_id: parentRoomId,
            });
          });
        }

        const c: RoomJoinRulesEventContent = {
          join_rule: joinRule,
        };
        if (allow.length > 0) c.allow = allow;
        await mx.sendStateEvent(room.roomId, StateEvent.RoomJoinRules as any, c);
      },
      [mx, room]
    )
  );

  const submitting = submitState.status === AsyncStatus.Loading;

  return (
    <SequenceCard
      className={SequenceCardStyle}
      variant="SurfaceVariant"
      direction="Column"
      gap="400"
    >
      <SettingTile
        title="Room Access"
        description="Change how people can join the room."
        after={
          <JoinRulesSwitcher
            icons={icons}
            labels={labels}
            rules={joinRules}
            value={rule}
            onChange={submit}
            disabled={!canEdit || submitting}
            changing={submitting}
          />
        }
      >
        {submitState.status === AsyncStatus.Error && (
          <Text style={{ color: color.Critical.Main }} size="T200">
            {(submitState.error as MatrixError).message}
          </Text>
        )}
      </SettingTile>
    </SequenceCard>
  );
}
