import React, { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Text,
  IconButton,
  Icon,
  Icons,
  Spinner,
  PopOut,
  Menu,
  MenuItem,
  config,
} from 'folds';
import {
  LiveKitRoom,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
  AudioTrack,
  useConnectionState,
  useSpeakingParticipants,
} from '@livekit/components-react';
import { Track, ConnectionState, ConnectionQuality } from 'livekit-client';
import classNames from 'classnames';
import { useAtomValue, useSetAtom } from 'jotai';

import * as css from './VoiceChannel.css';
import { useVoiceConnection, useVoiceChannelSettings } from '../../state/hooks/voiceChannel';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useVoiceRoomId } from '../../state/hooks/voiceChannel';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { getMemberAvatarMxc } from '../../utils/room';
import { mxcUrlToHttp } from '../../utils/matrix';
import { UserAvatar } from '../../components/user-avatar';
import { voiceParticipantVolumesAtom, voiceSpeakingAtom } from '../../state/voiceChannel';
import { useParticipantSounds } from './useParticipantSounds';
import { ConnectionQualityBars } from './ConnectionQualityBars';
import { playConnectedSound, playDisconnectedSound } from './voiceSounds';

/* ── Detect browser engine for fix instructions ────────────────────── */
function detectBrowserEngine(): 'chromium' | 'firefox' | 'unknown' {
  const ua = navigator.userAgent;
  if (/Firefox\//i.test(ua) || /Gecko\//i.test(ua)) return 'firefox';
  if (/Chrom(e|ium)\//i.test(ua)) return 'chromium';
  return 'unknown';
}

const WEBRTC_ERROR_RE = /could not establish pc connection|ice.*(fail|timeout)|peer.*connection/i;

function isWebRTCPolicyError(error: string): boolean {
  return WEBRTC_ERROR_RE.test(error);
}

/* ── WebRTC failure notice ─────────────────────────────────────────── */
type WebRTCFailureNoticeProps = {
  onDismiss: () => void;
  onRetry: (roomId: string, roomName: string) => void;
  roomId: string;
  roomName: string;
};

function WebRTCFailureNotice({ onDismiss, onRetry, roomId, roomName }: WebRTCFailureNoticeProps) {
  const engine = detectBrowserEngine();

  return (
    <Box className={css.VoiceChannelPanel} direction="Column">
      <div className={css.ErrorPanel}>
        <div className={css.ErrorTitle}>
          <Icon size="200" src={Icons.Warning} />
          <Text size="H6" style={{ fontWeight: 600 }}>
            Voice Connection Failed
          </Text>
        </div>

        <div className={css.ErrorBody}>
          <Text size="T300" priority="400">
            WebRTC is disabled or restricted in your browser. Privacy browsers
            block the UDP connections voice chat needs. To fix this:
          </Text>
        </div>

        {engine === 'chromium' && (
          <Box direction="Column" gap="100">
            <div className={css.ErrorStep}>
              <span className={css.ErrorStepNumber}>1</span>
              <Text size="T300">
                Open a new tab and go to:
              </Text>
            </div>
            <div style={{ paddingLeft: 28 }}>
              <span className={css.ErrorCode}>chrome://flags/#webrtc-ip-handling-policy</span>
            </div>
            <div className={css.ErrorStep}>
              <span className={css.ErrorStepNumber}>2</span>
              <Text size="T300">
                Change the value from <strong>"Disable non-proxied UDP"</strong> to <strong>"Default"</strong>
              </Text>
            </div>
            <div className={css.ErrorStep}>
              <span className={css.ErrorStepNumber}>3</span>
              <Text size="T300">
                Click <strong>Relaunch</strong> at the bottom of the page, then try again
              </Text>
            </div>
          </Box>
        )}

        {engine === 'firefox' && (
          <Box direction="Column" gap="100">
            <div className={css.ErrorStep}>
              <span className={css.ErrorStepNumber}>1</span>
              <Text size="T300">
                Open a new tab and go to:
              </Text>
            </div>
            <div style={{ paddingLeft: 28 }}>
              <span className={css.ErrorCode}>about:config</span>
            </div>
            <div className={css.ErrorStep}>
              <span className={css.ErrorStepNumber}>2</span>
              <Text size="T300">
                Search for <span className={css.ErrorCode}>media.peerconnection.ice.proxy_only</span> and set it to <strong>false</strong>
              </Text>
            </div>
            <div className={css.ErrorStep}>
              <span className={css.ErrorStepNumber}>3</span>
              <Text size="T300">
                Also set <span className={css.ErrorCode}>media.peerconnection.ice.no_host</span> to <strong>false</strong>
              </Text>
            </div>
            <div className={css.ErrorStep}>
              <span className={css.ErrorStepNumber}>4</span>
              <Text size="T300">
                Restart the browser, then try again
              </Text>
            </div>
          </Box>
        )}

        {engine === 'unknown' && (
          <div className={css.ErrorBody}>
            <Text size="T300">
              Check your browser settings and ensure WebRTC / peer connections are
              not blocked. Look for a "WebRTC IP handling policy" or similar setting
              and set it to "Default."
            </Text>
          </div>
        )}

        <div className={css.ErrorActions}>
          <IconButton
            onClick={() => onRetry(roomId, roomName)}
            variant="Success"
            size="300"
            radii="300"
            aria-label="Retry connection"
          >
            <Icon size="200" src={Icons.RecentClock} />
          </IconButton>
          <IconButton
            onClick={onDismiss}
            variant="Secondary"
            size="300"
            radii="300"
            aria-label="Dismiss"
          >
            <Icon size="200" src={Icons.Cross} />
          </IconButton>
        </div>
      </div>
    </Box>
  );
}

/* ── Generic error notice (non-WebRTC errors) ──────────────────────── */
type GenericErrorNoticeProps = {
  error: string;
  onDismiss: () => void;
  onRetry: (roomId: string, roomName: string) => void;
  roomId: string;
  roomName: string;
};

function GenericErrorNotice({ error, onDismiss, onRetry, roomId, roomName }: GenericErrorNoticeProps) {
  return (
    <Box className={css.VoiceChannelPanel} direction="Column">
      <div className={css.ErrorPanel}>
        <div className={css.ErrorTitle}>
          <Icon size="200" src={Icons.Warning} />
          <Text size="H6" style={{ fontWeight: 600 }}>
            Voice Error
          </Text>
        </div>
        <div className={css.ErrorBody}>
          <Text size="T300">{error}</Text>
        </div>
        <div className={css.ErrorActions}>
          <IconButton
            onClick={() => onRetry(roomId, roomName)}
            variant="Success"
            size="300"
            radii="300"
            aria-label="Retry connection"
          >
            <Icon size="200" src={Icons.RecentClock} />
          </IconButton>
          <IconButton
            onClick={onDismiss}
            variant="Secondary"
            size="300"
            radii="300"
            aria-label="Dismiss"
          >
            <Icon size="200" src={Icons.Cross} />
          </IconButton>
        </div>
      </div>
    </Box>
  );
}

type VoiceParticipantProps = {
  identity: string;
  name: string;
  avatarUrl?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
  volume: number;
  connectionQuality: ConnectionQuality;
  onVolumeChange: (identity: string, value: number) => void;
};

function VoiceParticipant({
  identity,
  name,
  avatarUrl,
  isSpeaking,
  isMuted,
  isLocal,
  volume,
  connectionQuality,
  onVolumeChange,
}: VoiceParticipantProps) {
  const initial = name ? name.charAt(0).toUpperCase() : identity?.charAt(1)?.toUpperCase() ?? '?';
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number; width: number; height: number } | undefined>();
  const tileRef = React.useRef<HTMLDivElement>(null);
  const isMutedForMe = volume === 0;

  const handleTileClick = useCallback(() => {
    if (isLocal) return;
    setMenuAnchor((prev) =>
      prev ? undefined : (tileRef.current?.getBoundingClientRect() ?? undefined)
    );
  }, [isLocal]);

  useEffect(() => {
    if (!menuAnchor) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const portal = document.getElementById('portalContainer');
      if (portal?.contains(target)) return;
      if (tileRef.current?.contains(target)) return;
      setMenuAnchor(undefined);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [menuAnchor]);

  const tileContent = (
    <div ref={tileRef}>
      <Box
        className={classNames(css.ParticipantTile, isLocal && css.ParticipantTileLocal)}
        alignItems="Center"
        gap="200"
        onClick={handleTileClick}
      >
      <Avatar
        size="300"
        radii="Pill"
        className={classNames(css.ParticipantAvatar, {
          [css.ParticipantSpeaking]: isSpeaking && !isMuted,
        })}
      >
        <UserAvatar
          userId={identity}
          src={avatarUrl}
          alt={name}
          renderFallback={() => <Text size="B400">{initial}</Text>}
        />
      </Avatar>
      <Box grow="Yes" direction="Column">
        <Text size="T300" truncate>
          {name}
        </Text>
      </Box>
      {isMuted && <Icon size="100" src={Icons.MicMute} title="Mic muted" />}
      {!isLocal && isMutedForMe && (
        <Icon size="100" src={Icons.VolumeMute} title="Muted for you" />
      )}
      <ConnectionQualityBars quality={connectionQuality} size={12} />
      </Box>
    </div>
  );

  if (isLocal) {
    return tileContent;
  }

  return (
    <PopOut
      anchor={menuAnchor}
      position="Top"
      align="Start"
      offset={4}
      content={
        menuAnchor ? (
          <Menu variant="SurfaceVariant" style={{ minWidth: 180 }}>
            <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
              <MenuItem
                size="300"
                radii="300"
                onClick={() => {
                  onVolumeChange(identity, isMutedForMe ? 1 : 0);
                  setMenuAnchor(undefined);
                }}
              >
                <Text as="span" size="T300">
                  {isMutedForMe ? 'Unmute for me' : 'Mute for me'}
                </Text>
              </MenuItem>
              <Box direction="Column" gap="100" style={{ padding: `0 ${config.space.S100}` }}>
                <Text as="span" size="T200" priority="300">
                  Volume
                </Text>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  onChange={(e) => onVolumeChange(identity, Number(e.target.value) / 100)}
                  className={css.ParticipantVolumeSlider}
                />
              </Box>
            </Box>
          </Menu>
        ) : null
      }
    >
      {tileContent}
    </PopOut>
  );
}

function VoiceParticipantList() {
  const participants = useParticipants();
  const audioTracks = useTracks([Track.Source.Microphone]);
  const [settings] = useVoiceChannelSettings();
  const participantVolumes = useAtomValue(voiceParticipantVolumesAtom);
  const setParticipantVolumes = useSetAtom(voiceParticipantVolumesAtom);
  const setSpeaking = useSetAtom(voiceSpeakingAtom);
  const mx = useMatrixClient();
  const voiceRoomId = useVoiceRoomId();
  const useAuthentication = useMediaAuthentication();
  const room = voiceRoomId ? mx.getRoom(voiceRoomId) ?? undefined : undefined;

  // Play join/leave audio cues
  useParticipantSounds();

  // Use dedicated LiveKit hook for reliable speaking detection
  const speakingParticipants = useSpeakingParticipants();

  // Push "someone is speaking" state to global atom for room-list badge glow
  useEffect(() => {
    if (!voiceRoomId) return;
    const anyoneSpeaking = speakingParticipants.length > 0;
    setSpeaking((prev) => {
      if (prev[voiceRoomId] === anyoneSpeaking) return prev;
      return { ...prev, [voiceRoomId]: anyoneSpeaking };
    });
  }, [speakingParticipants, voiceRoomId, setSpeaking]);

  // Clean up speaking state when unmounting
  useEffect(() => {
    return () => {
      if (voiceRoomId) {
        setSpeaking((prev) => {
          const next = { ...prev };
          delete next[voiceRoomId];
          return next;
        });
      }
    };
  }, [voiceRoomId, setSpeaking]);

  const handleVolumeChange = useCallback((identity: string, value: number) => {
    setParticipantVolumes((prev) => ({ ...prev, [identity]: value }));
  }, [setParticipantVolumes]);

  if (participants.length === 0) {
    return (
      <div className={css.NoParticipants}>
        <Text size="T300">Just you in voice — others will appear here when they join</Text>
      </div>
    );
  }

  return (
    <Box direction="Column" gap="100">
      {participants.map((participant) => {
        const audioTrack = audioTracks.find(
          (track) => track.participant.identity === participant.identity
        );
        const mxc = room ? getMemberAvatarMxc(room, participant.identity) : undefined;
        const avatarUrl =
          mxc
            ? mxcUrlToHttp(mx, mxc, useAuthentication, 64, 64, 'crop') ?? undefined
            : undefined;
        const volume =
          participantVolumes[participant.identity] ?? settings.outputVolume ?? 1;
        return (
          <React.Fragment key={participant.identity}>
            <VoiceParticipant
              identity={participant.identity}
              name={participant.name || participant.identity}
              avatarUrl={avatarUrl}
              isSpeaking={participant.isSpeaking}
              isMuted={audioTrack?.publication?.isMuted ?? true}
              isLocal={participant.isLocal}
              volume={volume}
              connectionQuality={participant.connectionQuality}
              onVolumeChange={handleVolumeChange}
            />
            {audioTrack && !participant.isLocal && (
              <AudioTrack trackRef={audioTrack} volume={volume} />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}

function VoiceControls() {
  const { toggleMute, toggleDeafen, disconnect, isMuted, isDeafened, setMute } = useVoiceConnection();
  const [settings] = useVoiceChannelSettings();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const connectionState = useConnectionState();

  // Only publish/sync mic AFTER the room is fully connected.
  // audio={false} on LiveKitRoom means we control mic publishing here, which avoids
  // the race between LiveKitRoom's auto-publish and this effect that broke Chrome audio.
  useEffect(() => {
    if (connectionState === ConnectionState.Connected && localParticipant) {
      localParticipant.setMicrophoneEnabled(!isMuted);
    }
  }, [isMuted, localParticipant, connectionState]);

  // Push-to-talk: hold key to unmute, release to mute
  useEffect(() => {
    if (!(settings.pushToTalk ?? false) || !settings.pushToTalkKey) return;
    const code = settings.pushToTalkKey;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === code && !e.repeat) {
        e.preventDefault();
        setMute(false);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === code && !e.repeat) {
        e.preventDefault();
        setMute(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [settings.pushToTalk, settings.pushToTalkKey, setMute]);

  const handleDisconnect = useCallback(() => {
    room?.disconnect();
    disconnect();
  }, [room, disconnect]);

  return (
    <Box className={css.VoiceChannelControls} justifyContent="Center" gap="200">
      <IconButton
        onClick={toggleMute}
        className={classNames(css.VoiceButton, {
          [css.VoiceButtonMuted]: isMuted,
        })}
        variant={isMuted ? 'Critical' : 'Secondary'}
        size="300"
        radii="Pill"
        aria-label={isMuted ? 'Unmute mic' : 'Mute mic'}
      >
        <Icon size="300" src={isMuted ? Icons.MicMute : Icons.Mic} />
      </IconButton>

      <IconButton
        onClick={toggleDeafen}
        className={classNames(css.VoiceButton, {
          [css.VoiceButtonMuted]: isDeafened,
        })}
        variant={isDeafened ? 'Critical' : 'Secondary'}
        size="300"
        radii="Pill"
        aria-label={isDeafened ? 'Undeafen' : 'Deafen (mute others)'}
      >
        <Icon size="300" src={isDeafened ? Icons.VolumeMute : Icons.VolumeHigh} />
      </IconButton>

      <IconButton
        onClick={handleDisconnect}
        variant="Critical"
        size="300"
        radii="Pill"
        aria-label="Leave voice"
      >
        <Icon size="300" src={Icons.Phone} />
      </IconButton>
    </Box>
  );
}

function VoiceChannelConnected() {
  const { roomName } = useVoiceConnection();
  const participants = useParticipants();
  const [expanded, setExpanded] = useState(false);
  const inVoiceLabel =
    participants.length === 0 ? 'Just you' : `${participants.length} in voice`;

  return (
    <Box className={css.VoiceChannelPanel} direction="Column">
      {expanded ? (
        <>
          <Box
            className={css.VoiceChannelHeader}
            alignItems="Center"
            justifyContent="SpaceBetween"
          >
            <Box alignItems="Center" gap="200">
              <Icon size="200" src={Icons.Phone} className={css.VoiceButtonActive} />
              <Text size="T300" truncate>
                Voice
              </Text>
              <Text size="T200" priority="400">
                {inVoiceLabel}
              </Text>
            </Box>
            <Box alignItems="Center" gap="100">
              {roomName && (
                <Text size="T200" priority="400" truncate>
                  {roomName}
                </Text>
              )}
              <IconButton
                size="300"
                variant="Surface"
                fill="None"
                radii="300"
                aria-label="Collapse voice panel"
                onClick={() => setExpanded(false)}
              >
                <Icon size="200" src={Icons.ChevronBottom} />
              </IconButton>
            </Box>
          </Box>
          <div className={css.VoiceChannelContent}>
            <VoiceParticipantList />
          </div>
          <VoiceControls />
        </>
      ) : (
        <Box className={css.VoiceChannelCompact} alignItems="Center">
          <Box
            alignItems="Center"
            gap="200"
            grow="Yes"
            onClick={() => setExpanded(true)}
            style={{ cursor: 'pointer', minWidth: 0 }}
          >
            <Icon size="200" src={Icons.Phone} className={css.VoiceButtonActive} />
            <Text size="T300" priority="500" truncate>
              Voice · {inVoiceLabel}
            </Text>
          </Box>
          <VoiceControls />
          <IconButton
            size="300"
            variant="Surface"
            fill="None"
            radii="300"
            aria-label="Expand voice panel"
            onClick={() => setExpanded(true)}
          >
            <Icon size="200" src={Icons.ChevronTop} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

type VoiceChannelPanelProps = {
  roomId: string;
  roomName: string;
};

export function VoiceChannelPanel({ roomId, roomName }: VoiceChannelPanelProps) {
  const {
    isConnected,
    isConnecting,
    token,
    error,
    connect,
    disconnect,
    reportError,
  } = useVoiceConnection();
  const [settings] = useVoiceChannelSettings();
  const wasConnectedRef = React.useRef(false);

  // Play connection/disconnection sounds when voice state changes
  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      playConnectedSound();
    } else if (!isConnected && wasConnectedRef.current) {
      playDisconnectedSound();
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected]);

  const handleRoomError = useCallback(
    (err: Error) => {
      const msg = err?.message ?? String(err);
      reportError(msg);
    },
    [reportError]
  );

  const handleDismiss = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Show nothing if no voice settings configured
  if (!settings.livekitServerUrl) {
    return null;
  }

  // Show WebRTC-specific failure notice with browser fix steps
  if (error && isWebRTCPolicyError(error)) {
    return (
      <WebRTCFailureNotice
        onDismiss={handleDismiss}
        onRetry={connect}
        roomId={roomId}
        roomName={roomName}
      />
    );
  }

  // Show generic error notice with retry
  if (error) {
    return (
      <GenericErrorNotice
        error={error}
        onDismiss={handleDismiss}
        onRetry={connect}
        roomId={roomId}
        roomName={roomName}
      />
    );
  }

  // Show connecting state
  if (isConnecting) {
    return (
      <Box className={css.VoiceChannelPanel} direction="Column">
        <Box
          className={css.VoiceChannelHeader}
          alignItems="Center"
          justifyContent="Center"
          gap="200"
        >
          <Spinner size="200" />
          <Text size="T300">Connecting to voice...</Text>
        </Box>
      </Box>
    );
  }

  // When connected, render LiveKitRoom here in the room view
  if (isConnected && token) {
    return (
      <LiveKitRoom
        serverUrl={settings.livekitServerUrl}
        token={token}
        connect={true}
        audio={false}
        video={false}
        onDisconnected={disconnect}
        onError={handleRoomError}
      >
        <VoiceChannelConnected />
      </LiveKitRoom>
    );
  }

  // Not connected - show nothing (button in header handles connection)
  return null;
}

/**
 * Global voice panel at layout level. Old build rendered LiveKitRoom only inside the room view;
 * when connected the room view shows the call, so we render nothing here to avoid double mount.
 */
export function VoiceChannelPanelGlobal() {
  return null;
}

export default VoiceChannelPanel;
