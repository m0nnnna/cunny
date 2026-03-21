import React, { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Text,
  IconButton,
  Icon,
  Icons,
  Spinner,
  PopOut,
  Menu,
  MenuItem,
  config,
  color,
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
import {
  Track,
  ConnectionState,
  ConnectionQuality,
  RoomEvent,
  type RemoteTrackPublication,
  type LocalVideoTrack,
} from 'livekit-client';
import classNames from 'classnames';
import { useAtomValue, useSetAtom } from 'jotai';

import * as css from './VoiceChannel.css';
import {
  useVoiceConnection,
  useVoiceChannelSettings,
} from '../../state/hooks/voiceChannel';
import {
} from '../../state/voiceChannel';
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
import { getScreenSharePopoutUrl } from './ScreenSharePopout';
import {
  voiceChannelRoomOptions,
  validateScreenShareCodecSupport,
  setScreenShareJitterBufferTarget,
  SERVER_MAX_BITRATE_CAP,
} from './voiceChannelRoomOptions';

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
      {isMuted && <Icon size="100" src={Icons.MicMute} aria-label="Mic muted" />}
      {!isLocal && isMutedForMe && (
        <Icon size="100" src={Icons.VolumeMute} aria-label="Muted for you" />
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
        <Text size="T300">Just you here~ others will appear when they join 🐾</Text>
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

type VoiceControlsProps = {
  /** Required from parent to avoid useTracks([ScreenShare]) which throws "r is not a function". */
  isLocalSharing: boolean;
  someoneElseSharing: boolean;
};

function VoiceControls({ isLocalSharing, someoneElseSharing }: VoiceControlsProps) {
  const { toggleMute, toggleDeafen, disconnect, isMuted, isDeafened, setMute } = useVoiceConnection();
  const [settings] = useVoiceChannelSettings();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const connectionState = useConnectionState();

  useEffect(() => {
    if (connectionState === ConnectionState.Connected && localParticipant) {
      localParticipant.setMicrophoneEnabled(!isMuted);
    }
  }, [isMuted, localParticipant, connectionState]);

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

  // 1080p@60 capture. `video: { displaySurface: 'monitor' }` is the correct LiveKit field to pre-select
  // "Entire Screen" in Chrome's picker – uses DXGI (GPU zero-copy on Windows, no CPU downscale).
  // 1080p ideal resolution lets the browser capture at native resolution without CPU scaling.
  const screenShareCaptureOptions = React.useMemo(
    () => ({
      audio: true,
      suppressLocalAudioPlayback: true,
      systemAudio: 'include' as const,
      // Use the LiveKit-standard `video` field – displaySurface here actually reaches getDisplayMedia.
      video: { displaySurface: 'monitor' } as const,
      // 1080p ideal + 60fps: browser uses DXGI zero-copy at native res rather than CPU-scaling 720p.
      resolution: { width: 1920, height: 1080, frameRate: 60 },
      contentHint: 'motion',
      selfBrowserSurface: 'exclude' as const,
    } as import('livekit-client').ScreenShareCaptureOptions),
    []
  );

  const handleScreenShare = useCallback(async () => {
    if (!localParticipant) return;
    try {
      if (!isLocalSharing) {
        await localParticipant.setScreenShareEnabled(true, screenShareCaptureOptions);
      } else {
        await localParticipant.setScreenShareEnabled(false);
      }
    } catch (err) {
      console.warn('Screen share failed:', err);
    }
  }, [localParticipant, isLocalSharing, screenShareCaptureOptions]);

  // Request keyframes periodically so viewers recover quickly from camera movement (otherwise
  // encoder keyframe interval can be 2–4s and quick pans look choppy until next I-frame).
  const screenShareSenderRef = React.useRef<RTCRtpSender | null>(null);
  useEffect(() => {
    if (!isLocalSharing || !localParticipant || !room) {
      screenShareSenderRef.current = null;
      return;
    }
    const tryCaptureSender = () => {
      const pub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
      const track = pub?.track as LocalVideoTrack & { simulcastCodecs?: Map<string, { sender?: RTCRtpSender }> };
      if (!track) return;
      // Prefer framerate over resolution when encoder is under load – critical for 60fps gaming.
      if (typeof (track as LocalVideoTrack).setDegradationPreference === 'function') {
        (track as LocalVideoTrack).setDegradationPreference('maintain-framerate').catch(() => {});
      }
      // Tell the browser's RTP encoder to handle fast motion (games) by prioritising smoothness.
      if (track.mediaStreamTrack) {
        (track.mediaStreamTrack as MediaStreamTrack & { contentHint?: string }).contentHint = 'motion';
      }
      // The primary RTCRtpSender lives on track.sender (not simulcastCodecs, which is for backup codecs).
      const sender =
        (track as LocalVideoTrack).sender ??
        track.simulcastCodecs?.get('h264')?.sender ??
        track.simulcastCodecs?.get('vp8')?.sender;
      if (sender) screenShareSenderRef.current = sender;
    };
    tryCaptureSender();
    const onPublished = () => {
      tryCaptureSender();
    };
    room.on(RoomEvent.LocalTrackPublished, onPublished);
    const t = setTimeout(tryCaptureSender, 500);
    return () => {
      room.off(RoomEvent.LocalTrackPublished, onPublished);
      clearTimeout(t);
      screenShareSenderRef.current = null;
    };
  }, [isLocalSharing, localParticipant, room]);

  // Adaptive bitrate for 1080p@60: scale up when FPS drops so encoder has headroom to maintain framerate.
  const senderStatsRef = React.useRef<{ framesEncoded: number; ts: number } | null>(null);
  useEffect(() => {
    const SMOOTH_BITRATE = 8_000_000;      // 8 Mbps – baseline for smooth 1080p60
    const DEMANDING_BITRATE = 12_000_000;  // 12 Mbps – when fps dips, give encoder more room
    const CRITICAL_BITRATE = 15_000_000;   // 15 Mbps – last resort before frame drops
    if (!isLocalSharing) return;
    const KEYFRAME_MS = 4000;   // 4s – minimal I-frames so encoder focuses on P-frames

    let keyframeTimeoutId: ReturnType<typeof setTimeout>;
    const requestKeyframe = () => {
      const sender = screenShareSenderRef.current;
      if (!sender?.getParameters) return;
      try {
        const params = sender.getParameters();
        if (params?.encodings?.length) {
          (sender as RTCRtpSender & { setParameters(p: RTCRtpSendParameters, o?: unknown): Promise<void> }).setParameters(
            params,
            { encodingOptions: [{ keyFrame: true }] }
          );
        }
      } catch {
        // ignore
      }
      keyframeTimeoutId = setTimeout(requestKeyframe, KEYFRAME_MS);
    };

    const applySenderBitrate = (maxBitrate: number) => {
      const sender = screenShareSenderRef.current;
      if (!sender?.getParameters) return;
      try {
        const params = sender.getParameters();
        if (params?.encodings?.length) {
          // Stamp priority + networkPriority on every setParameters call so they
          // survive any WebRTC renegotiation that resets encoding params.
          const encodings = params.encodings.map((e) => ({
            ...e,
            maxBitrate,
            priority: 'high' as RTCPriorityType,
            networkPriority: 'high' as RTCPriorityType,
          }));
          (sender as RTCRtpSender & { setParameters(p: RTCRtpSendParameters): Promise<void> }).setParameters({ ...params, encodings });
        }
      } catch {
        // ignore
      }
    };

    const statsPollId = setInterval(async () => {
      const sender = screenShareSenderRef.current;
      if (!sender?.getStats) return;
      try {
        const report = await sender.getStats();
        let framesEncoded: number | undefined;
        report.forEach((s) => {
          if (s.type === 'outbound-rtp' && (s as { kind?: string }).kind === 'video') {
            framesEncoded = (s as { framesEncoded?: number }).framesEncoded;
          }
        });
        if (framesEncoded === undefined) return;
        const ts = Date.now();
        const prev = senderStatsRef.current;
        senderStatsRef.current = { framesEncoded, ts };
        if (prev) {
          const dt = (ts - prev.ts) / 1000;
          const fps = dt > 0 ? (framesEncoded - prev.framesEncoded) / dt : 60;
          const tier = fps < 40 ? 'critical' : fps < 55 ? 'demanding' : 'smooth';
          const nextBitrate = tier === 'critical' ? CRITICAL_BITRATE : tier === 'demanding' ? DEMANDING_BITRATE : SMOOTH_BITRATE;
          const capped = SERVER_MAX_BITRATE_CAP != null ? Math.min(nextBitrate, SERVER_MAX_BITRATE_CAP) : nextBitrate;
          applySenderBitrate(capped);
          if (tier !== 'smooth' && localParticipant) {
            const pub = localParticipant.getTrackPublication(Track.Source.ScreenShare);
            const track = pub?.track as LocalVideoTrack | undefined;
            if (typeof track?.setDegradationPreference === 'function') {
              (track as LocalVideoTrack).setDegradationPreference('maintain-framerate').catch(() => {});
            }
          }
        }
      } catch {
        // ignore
      }
    }, 500);

    keyframeTimeoutId = setTimeout(requestKeyframe, KEYFRAME_MS);
    return () => {
      clearInterval(statsPollId);
      clearTimeout(keyframeTimeoutId);
    };
  }, [isLocalSharing, localParticipant]);

  return (
    <Box alignItems="Center" gap="100">
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
        <Icon size="200" src={isMuted ? Icons.MicMute : Icons.Mic} />
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
        <Icon size="200" src={isDeafened ? Icons.VolumeMute : Icons.VolumeHigh} />
      </IconButton>

      <IconButton
        onClick={handleScreenShare}
        disabled={someoneElseSharing}
        className={classNames(css.VoiceButton, {
          [css.ScreenShareButtonSharing]: isLocalSharing,
        })}
        variant={isLocalSharing ? 'Success' : 'Secondary'}
        size="300"
        radii="Pill"
        aria-label={
          someoneElseSharing
            ? 'Someone is already sharing'
            : isLocalSharing
              ? 'Stop sharing'
              : 'Share screen'
        }
        title={
          someoneElseSharing
            ? 'Someone is already sharing'
            : isLocalSharing
              ? 'Stop sharing'
              : 'Share screen'
        }
      >
        <Icon size="200" src={Icons.Terminal} />
      </IconButton>

      <IconButton
        onClick={handleDisconnect}
        variant="Critical"
        size="300"
        radii="Pill"
        aria-label="Leave voice"
      >
        <Icon size="200" src={Icons.Phone} />
      </IconButton>
    </Box>
  );
}

/* ── Screenshare modal (large overlay view) ────────────────────────── */
type ScreenShareModalProps = {
  trackRef: TrackRefLike;
  sharerName: string;
  onClose: () => void;
};

function ScreenShareModal({ trackRef, sharerName, onClose }: ScreenShareModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={css.ScreenShareModalBackdrop} onClick={onClose}>
      <div className={css.ScreenShareModalHeader}>
        <Text size="T300" style={{ color: '#fff' }}>
          {sharerName} is sharing their screen
        </Text>
        <IconButton
          onClick={onClose}
          variant="Secondary"
          size="300"
          radii="Pill"
          aria-label="Close"
        >
          <Icon size="300" src={Icons.Cross} />
        </IconButton>
      </div>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div onClick={(e) => e.stopPropagation()}>
        <ScreenShareVideo trackRef={trackRef} className={css.ScreenShareModalVideo} />
      </div>
    </div>
  );
}

/* ── Manual screen-share video (avoids LiveKit VideoTrack "r is not a function" bug) ── */
type TrackRefLike =
  | ReturnType<typeof useTracks>[number]
  | { publication: { track?: { mediaStreamTrack?: MediaStreamTrack } | unknown }; participant: unknown };
function getMediaStreamTrackFromRef(trackRef: TrackRefLike | null): MediaStreamTrack | null {
  if (!trackRef) return null;
  const ref = trackRef as {
    publication?: { track?: { mediaStreamTrack?: MediaStreamTrack } };
    track?: { mediaStreamTrack?: MediaStreamTrack };
  };
  const track = ref.publication?.track ?? ref.track;
  return track?.mediaStreamTrack ?? null;
}

function ScreenShareVideo({
  trackRef,
  className,
}: {
  trackRef: TrackRefLike;
  className?: string;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!trackRef) {
      setStream(null);
      return;
    }
    const mt = getMediaStreamTrackFromRef(trackRef);
    if (mt) {
      setStream(new MediaStream([mt]));
      return;
    }
    // Track may not be on publication yet (set asynchronously by SDK). Poll briefly.
    let count = 0;
    const maxTries = 50;
    const id = setInterval(() => {
      count += 1;
      const t = getMediaStreamTrackFromRef(trackRef);
      if (t) {
        clearInterval(id);
        setStream(new MediaStream([t]));
      } else if (count >= maxTries) {
        clearInterval(id);
      }
    }, 100);
    return () => {
      clearInterval(id);
      setStream(null);
    };
  }, [trackRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      <video ref={videoRef} className={className} playsInline muted autoPlay />
      {trackRef && !stream && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            fontSize: 14,
          }}
        >
          Loading stream... 🐾
        </div>
      )}
    </div>
  );
}

/* ── Screenshare inline preview ────────────────────────────────────── */
type ScreenSharePreviewProps = {
  trackRef: TrackRefLike;
  sharerName: string;
  isLocal: boolean;
  onStopSharing?: () => void;
  onHide?: () => void;
};

function ScreenSharePreview({ trackRef, sharerName, isLocal, onStopSharing, onHide }: ScreenSharePreviewProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className={css.ScreenSharePreview} onClick={() => setModalOpen(true)}>
        {/* Only one video decode: when modal (big view) is open, thumbnail shows placeholder */}
        {modalOpen ? (
          <div className={css.ScreenSharePreviewVideo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#888', fontSize: 12 }}>
            Viewing fullscreen ✨
          </div>
        ) : (
          <ScreenShareVideo trackRef={trackRef} className={css.ScreenSharePreviewVideo} />
        )}
        <div className={css.ScreenShareLabel}>
          <span aria-hidden>🐾</span>
          <Text size="T200" style={{ color: '#fff' }}>
            {isLocal ? 'You are sharing' : `${sharerName} is sharing`}
          </Text>
        </div>
        {isLocal && onStopSharing && (
          <div className={css.ScreenShareStopOverlay}>
            <IconButton
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onStopSharing();
              }}
              variant="Critical"
              size="300"
              radii="Pill"
              aria-label="Stop sharing"
              title="Stop sharing"
            >
              <Icon size="200" src={Icons.Cross} />
            </IconButton>
          </div>
        )}
        {!isLocal && onHide && (
          <div className={css.ScreenShareHideOverlay}>
            <IconButton
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onHide();
              }}
              variant="Secondary"
              size="300"
              radii="Pill"
              aria-label="Hide screen share"
              title="Hide screen share"
            >
              <Icon size="200" src={Icons.Eye} />
            </IconButton>
          </div>
        )}
      </div>
      {modalOpen && (
        <ScreenShareModal
          trackRef={trackRef}
          sharerName={isLocal ? 'You' : sharerName}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

/** Error boundary so screen share viewer errors don't crash the whole app. */
class ScreenShareErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode; onReset?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.warn('Screen share viewer error:', error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/** Subscribe to a single screen-share (or screen-share-audio) publication so it loads for late joiners. */
function subscribeToScreenSharePublication(publication: RemoteTrackPublication): void {
  const source = publication.source;
  if (
    source !== Track.Source.ScreenShare &&
    source !== Track.Source.ScreenShareAudio
  ) {
    return;
  }
  if (!publication.isSubscribed) {
    publication.setSubscribed(true);
  }
}

/** Play remote screen-share audio from room (no useTracks). Subscribes to the sharer's ScreenShareAudio and plays with volume. */
function ScreenShareAudioPlayer({
  room,
  sharerIdentity,
  volume,
}: {
  room: ReturnType<typeof useRoomContext>;
  sharerIdentity: string;
  volume: number;
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);

  useEffect(() => {
    if (!room || !sharerIdentity) {
      setTrack(null);
      return;
    }
    const participant = room.remoteParticipants.get(sharerIdentity);
    const pub = participant?.getTrackPublication(Track.Source.ScreenShareAudio) as
      | { track?: { mediaStreamTrack?: MediaStreamTrack }; setSubscribed?: (v: boolean) => void }
      | undefined;
    if (!pub) {
      setTrack(null);
      return;
    }
    if (pub.setSubscribed && !pub.track) pub.setSubscribed(true);
    const getTrack = () => pub.track?.mediaStreamTrack ?? null;
    const t = getTrack();
    if (t) {
      setTrack(t);
      return;
    }
    let count = 0;
    const maxTries = 50;
    const id = setInterval(() => {
      count += 1;
      const tt = getTrack();
      if (tt) {
        setTrack(tt);
        clearInterval(id);
      } else if (count >= maxTries) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [room, sharerIdentity]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (track) {
      el.srcObject = new MediaStream([track]);
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
    return () => {
      el.srcObject = null;
    };
  }, [track]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

/** Subscribe to all existing remote screen-share tracks (fixes late joiners not seeing in-progress shares). */
function subscribeToExistingScreenShares(room: ReturnType<typeof useRoomContext>): void {
  if (!room?.remoteParticipants) return;
  room.remoteParticipants.forEach((participant) => {
    participant.trackPublications.forEach((publication: RemoteTrackPublication) => {
      subscribeToScreenSharePublication(publication);
    });
  });
}

/** Track ref shape we use for screen share (avoids useTracks which can trigger "r is not a function"). */
type ScreenShareTrackRef = {
  publication: { track?: { mediaStreamTrack?: MediaStreamTrack } | unknown };
  participant: { isLocal: boolean; identity: string; name?: string };
};

/** Get active screen share from room state + events instead of useTracks to avoid SDK render bug. */
function useScreenShareFromRoom(room: ReturnType<typeof useRoomContext> | undefined) {
  const [ref, setRef] = useState<ScreenShareTrackRef | null>(null);

  useEffect(() => {
    if (!room) {
      setRef(null);
      return;
    }
    const update = () => {
      const localPub = room.localParticipant?.getTrackPublication(Track.Source.ScreenShare) as
        | { track?: unknown }
        | undefined;
      // Use publication existence, not publication.track — remote track is set async after subscribe
      if (localPub) {
        setRef({
          publication: localPub,
          participant: room.localParticipant as ScreenShareTrackRef['participant'],
        });
        return;
      }
      for (const p of room.remoteParticipants?.values() ?? []) {
        const pub = p.getTrackPublication(Track.Source.ScreenShare) as
          | { track?: unknown }
          | undefined;
        if (pub) {
          setRef({
            publication: pub,
            participant: p as ScreenShareTrackRef['participant'],
          });
          return;
        }
      }
      setRef(null);
    };

    update();
    const t1 = setTimeout(update, 0);
    const t2 = setTimeout(update, 100);
    room.on(RoomEvent.TrackPublished, update);
    room.on(RoomEvent.TrackUnpublished, update);
    room.on(RoomEvent.LocalTrackPublished, update);
    room.on(RoomEvent.LocalTrackUnpublished, update);
    // When a remote track is attached after subscribe, refresh so UI shows the new sharer
    room.on(RoomEvent.TrackSubscribed, update);
    room.on(RoomEvent.TrackUnsubscribed, update);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      room.off(RoomEvent.TrackPublished, update);
      room.off(RoomEvent.TrackUnpublished, update);
      room.off(RoomEvent.LocalTrackPublished, update);
      room.off(RoomEvent.LocalTrackUnpublished, update);
      room.off(RoomEvent.TrackSubscribed, update);
      room.off(RoomEvent.TrackUnsubscribed, update);
    };
  }, [room]);

  const isLocalSharing = ref?.participant.isLocal ?? false;
  const someoneElseSharing = ref != null && !ref.participant.isLocal;
  return { activeScreenShareRef: ref, isLocalSharing, someoneElseSharing };
}

/** Wraps the screen share viewer in an error boundary so "r is not a function" etc. don't crash the app. */
function ScreenShareViewerWithBoundary({
  activeScreenShare,
  screenSharerName,
  screenSharerIsLocal,
  screenShareHidden,
  setScreenShareHidden,
  onStopSharing,
  token,
  serverUrl,
  getScreenSharePopoutUrl,
  room,
  sharerIdentity,
  screenShareVolume,
  onScreenShareVolumeChange,
}: {
  activeScreenShare: ScreenShareTrackRef;
  screenSharerName: string;
  screenSharerIsLocal: boolean;
  screenShareHidden: boolean;
  setScreenShareHidden: (v: boolean) => void;
  onStopSharing: () => void;
  token: string | undefined;
  serverUrl: string | undefined;
  getScreenSharePopoutUrl: (token: string, serverUrl: string) => string;
  room?: ReturnType<typeof useRoomContext>;
  sharerIdentity?: string | null;
  screenShareVolume?: number;
  onScreenShareVolumeChange?: (v: number) => void;
}) {
  const [boundaryKey, setBoundaryKey] = useState(0);
  const fallback = (
    <div className={css.ScreenShareSection}>
      <Box
        direction="Column"
        alignItems="Center"
        gap="200"
        style={{ padding: config.space.S300 }}
      >
        <Text size="T300">Couldn&apos;t load stream</Text>
        <Button variant="Secondary" size="300" radii="300" onClick={() => setBoundaryKey((k) => k + 1)}>
          Try again
        </Button>
      </Box>
    </div>
  );

  if (screenShareHidden) {
    return (
      <div className={css.ScreenShareHiddenBar}>
        <Box alignItems="Center" gap="200" style={{ minWidth: 0 }}>
          <span aria-hidden style={{ fontSize: '0.85rem' }}>🐾</span>
          <Text size="T200" priority="400" truncate>
            {screenSharerName} is sharing
          </Text>
        </Box>
        <IconButton
          size="300"
          variant="Secondary"
          fill="None"
          radii="300"
          aria-label="Show screen share"
          onClick={() => setScreenShareHidden(false)}
        >
          <Icon size="100" src={Icons.Eye} />
        </IconButton>
      </div>
    );
  }

  return (
    <ScreenShareErrorBoundary key={boundaryKey} fallback={fallback}>
      <div className={css.ScreenShareSection}>
        {token && serverUrl && (
          <Box alignItems="Center" gap="200" style={{ marginBottom: 8 }}>
            <IconButton
              size="300"
              variant="Secondary"
              fill="None"
              radii="300"
              aria-label="Pop out screen share into own window"
              title="Pop out into own window"
              onClick={() => {
                const url = getScreenSharePopoutUrl(token, serverUrl);
                window.open(url, 'screenShare', 'width=960,height=640,noopener');
              }}
            >
              <Icon size="200" src={Icons.External} />
            </IconButton>
            <Text size="T200" as="span">
              Pop out to window
            </Text>
          </Box>
        )}
        {!screenSharerIsLocal && room && sharerIdentity != null && (
          <Box direction="Column" gap="100" style={{ marginBottom: 8 }}>
            <Box alignItems="Center" gap="200">
              <Icon size="100" src={Icons.VolumeHigh} />
              <Text size="T200" as="span">
                Screen share volume
              </Text>
              {typeof screenShareVolume === 'number' && typeof onScreenShareVolumeChange === 'function' && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round((screenShareVolume ?? 1) * 100)}
                  onChange={(e) => onScreenShareVolumeChange(Number(e.target.value) / 100)}
                  aria-label="Screen share audio volume"
                  style={{ width: 100, accentColor: 'var(--color-accent)' }}
                />
              )}
            </Box>
            <ScreenShareAudioPlayer
              room={room}
              sharerIdentity={sharerIdentity}
              volume={typeof screenShareVolume === 'number' ? screenShareVolume : 1}
            />
          </Box>
        )}
        <ScreenSharePreview
          trackRef={activeScreenShare as TrackRefLike}
          sharerName={screenSharerName}
          isLocal={screenSharerIsLocal}
          onStopSharing={screenSharerIsLocal ? onStopSharing : undefined}
          onHide={!screenSharerIsLocal ? () => setScreenShareHidden(true) : undefined}
        />
      </div>
    </ScreenShareErrorBoundary>
  );
}

function VoiceChannelConnected() {
  const { roomName, token, serverUrl } = useVoiceConnection();
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const connectionState = useConnectionState();
  const { activeScreenShareRef: activeScreenShare, isLocalSharing, someoneElseSharing } =
    useScreenShareFromRoom(room);
  const [settings, setSettings] = useVoiceChannelSettings();
  const participantVolumes = useAtomValue(voiceParticipantVolumesAtom);
  const [expanded, setExpanded] = useState(false);
  const [screenShareHidden, setScreenShareHidden] = useState(false);
  // Screen share auto-shows immediately — our manual MediaStreamTrack renderer avoids the old SDK bug.
  const inVoiceLabel =
    participants.length === 0 ? 'Just you' : `${participants.length} in voice`;

  /** Lazily created worker for viewer keyframe requests (PLI) so camera turns recover faster. */
  const keyframeRequestWorkerRef = React.useRef<Worker | null>(null);
  /** When viewing screen share: receiver for getStats(), port to send dynamic keyframe interval. */
  const screenShareReceiverRef = React.useRef<RTCRtpReceiver | null>(null);
  const keyframePortRef = React.useRef<MessagePort | null>(null);
  const viewerStatsRef = React.useRef<{ framesDropped: number; jitterBufferDelay: number } | null>(null);
  const [viewerAdaptationTrigger, setViewerAdaptationTrigger] = useState(0);

  // Validate H.264 support once when connected (client + server use H.264 for screen share)
  useEffect(() => {
    if (connectionState === ConnectionState.Connected) validateScreenShareCodecSupport();
  }, [connectionState]);

  // Viewer: set larger jitter buffer + receiver transform; pass port so we can adapt keyframe request interval from stats
  useEffect(() => {
    if (!room) return;
    const handler = (
      track: { mediaStreamTrack?: MediaStreamTrack },
      publication: { source?: Track.Source }
    ) => {
      if (publication?.source !== Track.Source.ScreenShare) return;
      const mt = track?.mediaStreamTrack ?? (track as { track?: MediaStreamTrack })?.track;
      if (!keyframeRequestWorkerRef.current) {
        try {
          keyframeRequestWorkerRef.current = new Worker(
            new URL('./screenShareKeyframeRequest.worker.ts', import.meta.url),
            { type: 'module' }
          );
        } catch {
          // Encoded transforms / worker not supported (e.g. older browsers)
        }
      }
      const channel = new MessageChannel();
      keyframePortRef.current = channel.port1;
      channel.port1.start();
      const receiver = setScreenShareJitterBufferTarget(room as Parameters<typeof setScreenShareJitterBufferTarget>[0], mt, {
        keyframeRequestWorker: keyframeRequestWorkerRef.current ?? undefined,
        keyframeRequestPort: channel.port2,
      });
      screenShareReceiverRef.current = receiver ?? null;
      viewerStatsRef.current = null;
      setViewerAdaptationTrigger((n) => n + 1);
    };
    room.on(RoomEvent.TrackSubscribed, handler as (track: unknown, publication: unknown, participant: unknown) => void);
    return () => {
      room.off(RoomEvent.TrackSubscribed, handler as (track: unknown, publication: unknown, participant: unknown) => void);
      screenShareReceiverRef.current = null;
      keyframePortRef.current = null;
    };
  }, [room]);

  // Viewer: poll receiver stats and send dynamic keyframe interval to worker – tax decoder (more PLI when stressed).
  useEffect(() => {
    const receiver = screenShareReceiverRef.current;
    const port = keyframePortRef.current;
    if (!receiver?.getStats || !port) return;
    const SMOOTH_MS = 2000;    // smooth mode: fewer PLI so less load; when stressed we go demanding
    const DEMANDING_MS = 400;  // when stressed, request keyframes often for smooth recovery
    const STATS_POLL_MS = 1500; // react faster to choppy
    const DROPS_THRESHOLD = 1;  // any frame drop in window → demand keyframes
    const JITTER_LOW_SEC = 2;

    const id = setInterval(async () => {
      try {
        const report = await receiver.getStats();
        let framesDropped: number | undefined;
        let jitterBufferDelay: number | undefined;
        report.forEach((s) => {
          if (s.type === 'inbound-rtp' && (s as { kind?: string }).kind === 'video') {
            const v = s as { framesDropped?: number; jitterBufferDelay?: number };
            framesDropped = v.framesDropped;
            jitterBufferDelay = v.jitterBufferDelay;
          }
        });
        if (framesDropped === undefined) return;
        const prev = viewerStatsRef.current;
        viewerStatsRef.current = { framesDropped, jitterBufferDelay: jitterBufferDelay ?? 0 };
        const dropsDelta = prev ? framesDropped - prev.framesDropped : 0;
        const jitterLow = (jitterBufferDelay ?? 0) < JITTER_LOW_SEC;
        const demanding = dropsDelta >= DROPS_THRESHOLD || jitterLow;
        port.postMessage({ keyframeIntervalMs: demanding ? DEMANDING_MS : SMOOTH_MS });
      } catch {
        // ignore
      }
    }, STATS_POLL_MS);
    return () => clearInterval(id);
  }, [room, viewerAdaptationTrigger]);

  // Ensure late joiners and new screen shares get subscribed so the track loads
  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || !room) return;
    subscribeToExistingScreenShares(room);
    const onTrackPublished = (publication: RemoteTrackPublication) =>
      subscribeToScreenSharePublication(publication);
    room.on(RoomEvent.TrackPublished, onTrackPublished);
    return () => {
      room.off(RoomEvent.TrackPublished, onTrackPublished);
    };
  }, [connectionState, room]);
  const screenSharerIsLocal = activeScreenShare?.participant.isLocal ?? false;
  const screenSharerIdentity = activeScreenShare?.participant.identity ?? null;
  const screenSharerName = activeScreenShare
    ? activeScreenShare.participant.name || activeScreenShare.participant.identity
    : '';


  const prevSharerRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (screenSharerIdentity !== prevSharerRef.current) {
      setScreenShareHidden(false);
      prevSharerRef.current = screenSharerIdentity;
    }
  }, [screenSharerIdentity]);

  // Auto-subscribe when a screen share appears (handles late joiners seeing new shares)
  useEffect(() => {
    if (activeScreenShare?.publication) {
      subscribeToScreenSharePublication(activeScreenShare.publication as RemoteTrackPublication);
    }
  }, [activeScreenShare]);

  const handleStopSharing = useCallback(async () => {
    if (localParticipant) {
      try {
        await localParticipant.setScreenShareEnabled(false);
      } catch { /* ignore */ }
    }
  }, [localParticipant]);

  return (
    <Box className={css.VoiceChannelPanel} direction="Column">
      {/* ── Expandable: screen share on top, participants below, controls at bottom ── */}
      {expanded && (
        <>
          {activeScreenShare && (
            <ScreenShareViewerWithBoundary
              activeScreenShare={activeScreenShare}
              screenSharerName={screenSharerName}
              screenSharerIsLocal={screenSharerIsLocal}
              screenShareHidden={screenShareHidden}
              setScreenShareHidden={setScreenShareHidden}
              onStopSharing={handleStopSharing}
              token={token ?? undefined}
              serverUrl={serverUrl ?? undefined}
              getScreenSharePopoutUrl={getScreenSharePopoutUrl}
              room={room}
              sharerIdentity={screenSharerIdentity}
              screenShareVolume={settings.screenShareVolume}
              onScreenShareVolumeChange={(v) =>
                setSettings({
                  ...settings,
                  screenShareVolume: Math.max(0, Math.min(1, v)),
                })
              }
            />
          )}

          <div className={css.VoiceChannelContent}>
            <VoiceParticipantList />
          </div>
        </>
      )}

      {/* ── Controls bar — always last so it sits at the bottom of the card ── */}
      <Box className={css.VoiceChannelCompact} alignItems="Center">
        <IconButton
          size="300"
          variant="Surface"
          fill="None"
          radii="300"
          aria-label={expanded ? 'Collapse voice panel' : 'Expand voice panel'}
          onClick={() => setExpanded((v) => !v)}
        >
          <Icon size="200" src={expanded ? Icons.ChevronBottom : Icons.ChevronTop} />
        </IconButton>
        <Box
          alignItems="Center"
          gap="100"
          grow="Yes"
          shrink="Yes"
          onClick={() => setExpanded((v) => !v)}
          style={{ cursor: 'pointer', minWidth: 0 }}
        >
          <Icon size="200" src={Icons.Phone} className={css.VoiceButtonActive} />
          <Text size="T200" priority="500" truncate>
            {inVoiceLabel}
          </Text>
        </Box>
        <VoiceControls isLocalSharing={isLocalSharing} someoneElseSharing={someoneElseSharing} />
      </Box>

      {/* Screen share audio not rendered here to avoid useTracks([ScreenShareAudio]) which can trigger "r is not a function". */}
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
    serverUrl,
    error,
    connect,
    disconnect,
    reportError,
  } = useVoiceConnection();
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

  if (isConnecting) {
    return (
      <Box className={css.VoiceChannelPanel} direction="Column">
        <Box
          className={css.VoiceChannelCompact}
          alignItems="Center"
          justifyContent="Center"
          gap="200"
        >
          <Spinner size="200" />
          <Text size="T300">Connecting...</Text>
        </Box>
      </Box>
    );
  }

  // When connected, render LiveKitRoom here in the room view.
  // Wrap callbacks so they are always plain functions (avoids "r is not a function" from SDK).
  // Same options as viewers (voiceChannelRoomOptions) so codec/encoding is consistent for host and all viewers.
  if (isConnected && token && serverUrl) {
    return (
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        audio={false}
        video={false}
        options={voiceChannelRoomOptions}
        onDisconnected={() => {
          disconnect();
        }}
        onError={(err: Error) => {
          handleRoomError(err);
        }}
      >
        <VoiceChannelConnected />
      </LiveKitRoom>
    );
  }

  // Not connected - show nothing (button in header handles connection)
  return null;
}

/**
 * Global voice panel in the chat area (bottom of main content). When connected, the call stays
 * visible so it remains active when you navigate. Buttons are grouped neatly in the ribbon.
 */
export function VoiceChannelPanelGlobal() {
  const { isConnected, roomId, roomName } = useVoiceConnection();
  if (!isConnected || !roomId || !roomName) return null;
  return <VoiceChannelPanel roomId={roomId} roomName={roomName} />;
}

export default VoiceChannelPanel;
