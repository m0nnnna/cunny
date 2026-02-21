import React from 'react';
import { Box, Button, Icon, Icons, Text, config } from 'folds';
import {
  VOICE_INVITE_MSGTYPE,
  type VoiceInviteContent,
} from '../../state/voiceChannel';
import { useVoiceServerProfiles } from '../../state/hooks/voiceChannel';
import { useRoomNavigate } from '../../hooks/useRoomNavigate';

type VoiceInviteCardProps = {
  content: VoiceInviteContent;
};

export function VoiceInviteCard({ content }: VoiceInviteCardProps) {
  const { addProfile } = useVoiceServerProfiles();
  const { navigateRoom } = useRoomNavigate();
  const {
    server_url,
    token_endpoint,
    matrix_room_id,
    room_name,
    body,
  } = content;

  const displayName = room_name || matrix_room_id || 'Voice channel';

  const handleAddToAddressBook = () => {
    addProfile({
      name: room_name || `Voice: ${matrix_room_id.slice(0, 12)}…`,
      livekitServerUrl: server_url,
      livekitTokenEndpoint: token_endpoint,
    });
  };

  const handleJoin = () => {
    navigateRoom(matrix_room_id);
  };

  return (
    <Box
      direction="Column"
      gap="200"
      style={{
        padding: config.space.S300,
        borderRadius: config.radii.R400,
        backgroundColor: 'var(--bg-surface-variant, inherit)',
        border: '1px solid var(--border-surface-variant, transparent)',
      }}
    >
      <Box alignItems="Center" gap="200">
        <Icon size="200" src={Icons.Phone} />
        <Text size="T300" truncate>
          {body || `Invitation to join voice in ${displayName}`}
        </Text>
      </Box>
      <Box gap="200" wrap="Wrap">
        <Button
          variant="Primary"
          fill="Soft"
          size="300"
          radii="300"
          before={<Icon size="100" src={Icons.UserPlus} />}
          onClick={handleAddToAddressBook}
        >
          <Text size="B300">Add to address book</Text>
        </Button>
        <Button
          variant="Secondary"
          fill="Soft"
          size="300"
          radii="300"
          before={<Icon size="100" src={Icons.ArrowRight} />}
          onClick={handleJoin}
        >
          <Text size="B300">Join room</Text>
        </Button>
      </Box>
    </Box>
  );
}

export function isVoiceInviteContent(
  msgtype: string,
  content: Record<string, unknown>
): content is VoiceInviteContent {
  if (msgtype !== VOICE_INVITE_MSGTYPE) return false;
  return (
    typeof content?.server_url === 'string' &&
    typeof content?.token_endpoint === 'string' &&
    typeof content?.matrix_room_id === 'string'
  );
}
