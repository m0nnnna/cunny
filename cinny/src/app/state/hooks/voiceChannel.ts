import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import {
  voiceChannelSettingsAtom,
  voiceConnectionAtom,
  voiceParticipantsByRoomAtom,
  isVoiceConnectedAtom,
  isVoiceConnectingAtom,
  voiceRoomIdAtom,
  isMutedAtom,
  isDeafenedAtom,
  voiceSpeakingAtom,
  VoiceChannelSettings,
} from '../voiceChannel';
import { warmUpAudioContext } from '../../features/voice-channel/voiceSounds';
import { allRoomsAtom } from '../room-list/roomList';
import { useSpaceChildren, useRecursiveChildScopeFactory } from './roomList';
import { roomToParentsAtom } from '../room/roomToParents';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useSelectedSpace } from '../../hooks/router/useSelectedSpace';

export const useVoiceChannelSettings = () => {
  return useAtom(voiceChannelSettingsAtom);
};

export const useUpdateVoiceChannelSettings = () => {
  const [settings, setSettings] = useAtom(voiceChannelSettingsAtom);

  const updateSettings = useCallback(
    (updates: Partial<VoiceChannelSettings>) => {
      setSettings({ ...settings, ...updates });
    },
    [settings, setSettings]
  );

  return updateSettings;
};

export const useVoiceConnection = () => {
  const voiceConnection = useAtomValue(voiceConnectionAtom);
  const dispatch = useSetAtom(voiceConnectionAtom);
  const setParticipantsByRoom = useSetAtom(voiceParticipantsByRoomAtom);
  const settings = useAtomValue(voiceChannelSettingsAtom);
  const mx = useMatrixClient();

  const connect = useCallback(
    async (roomId: string, roomName: string) => {
      // Warm up AudioContext while we still have the user-gesture context from the click.
      // Browsers block Web Audio playback unless the context was started during a trusted event.
      warmUpAudioContext();

      if (!settings.livekitServerUrl || !settings.livekitTokenEndpoint) {
        dispatch({
          type: 'CONNECT_ERROR',
          error: 'LiveKit server URL or token endpoint not configured. Please configure in settings.',
        });
        return;
      }

      const participantIdentity = mx.getUserId();
      if (!participantIdentity) {
        dispatch({
          type: 'CONNECT_ERROR',
          error: 'Not logged in. Please log in to join voice.',
        });
        return;
      }

      // Request mic permission early (while user-gesture context from the click is still active).
      // This ensures the browser permission prompt appears during "Connecting..." rather than
      // after the LiveKit room mounts, which avoids ICE timeouts on first use and fixes Chrome
      // silently blocking getUserMedia when the gesture has expired.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        dispatch({
          type: 'CONNECT_ERROR',
          error: 'Microphone access denied. Please allow mic permission to join voice.',
        });
        return;
      }

      dispatch({ type: 'CONNECT_START', roomId, roomName });

      try {
        const response = await fetch(settings.livekitTokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName: `matrix-${roomId}`,
            participantName: participantIdentity,
          }),
        });

        if (!response.ok) {
          const status = response.status;
          if (status === 0) {
            throw new Error(
              'Cannot reach token server. Check URL and CORS, or network/firewall.'
            );
          }
          throw new Error(`Token server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const token = data.token;

        if (!token) {
          throw new Error('No token received from server');
        }

        dispatch({
          type: 'CONNECT_SUCCESS',
          token,
          joinMuted: settings.joinMuted ?? settings.pushToTalk ?? false,
        });
        setParticipantsByRoom((prev) => {
          const list = prev[roomId] ?? [];
          if (list.includes(participantIdentity)) return prev;
          return { ...prev, [roomId]: [...list, participantIdentity] };
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to connect to voice channel';
        dispatch({ type: 'CONNECT_ERROR', error: message });
      }
    },
    [settings, dispatch, mx, setParticipantsByRoom]
  );

  const disconnect = useCallback(
    () => {
      dispatch({ type: 'DISCONNECT' });
    },
    [dispatch]
  );

  /** Report a connection/room error (e.g. from LiveKitRoom onError). */
  const reportError = useCallback(
    (message: string) => {
      dispatch({ type: 'CONNECT_ERROR', error: message });
    },
    [dispatch]
  );

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
  }, [dispatch]);

  const setMute = useCallback(
    (muted: boolean) => {
      dispatch({ type: 'SET_MUTE', muted });
    },
    [dispatch]
  );

  const toggleDeafen = useCallback(() => {
    dispatch({ type: 'TOGGLE_DEAFEN' });
  }, [dispatch]);

  const setDeafen = useCallback(
    (deafened: boolean) => {
      dispatch({ type: 'SET_DEAFEN', deafened });
    },
    [dispatch]
  );

  return {
    ...voiceConnection,
    connect,
    disconnect,
    reportError,
    toggleMute,
    setMute,
    toggleDeafen,
    setDeafen,
    settings,
  };
};

export const useIsVoiceConnected = () => useAtomValue(isVoiceConnectedAtom);
export const useIsVoiceConnecting = () => useAtomValue(isVoiceConnectingAtom);
export const useVoiceRoomId = () => useAtomValue(voiceRoomIdAtom);
export const useIsMuted = () => useAtomValue(isMutedAtom);
export const useIsDeafened = () => useAtomValue(isDeafenedAtom);

/** Number of participants currently in this room's voice channel (from token server webhook). */
export const useVoiceParticipantCount = (roomId: string): number => {
  const byRoom = useAtomValue(voiceParticipantsByRoomAtom);
  return byRoom[roomId]?.length ?? 0;
};

/** Whether anyone is currently speaking in the given room's voice channel. */
export const useVoiceSpeaking = (roomId: string): boolean => {
  const speaking = useAtomValue(voiceSpeakingAtom);
  return speaking[roomId] ?? false;
};

/** Background poll interval for participant list. */
const VOICE_PARTICIPANTS_POLL_MS = 15_000;
/** Short delay after local join/leave before refreshing (let server process the event). */
const VOICE_PARTICIPANTS_JOIN_DELAY_MS = 1_500;

/** Build the participants endpoint URL from token endpoint + room IDs. */
function buildParticipantsUrl(tokenEndpoint: string, ids: string[]): string {
  const base = tokenEndpoint.replace(/\/token\/?$/i, '').replace(/\/$/, '');
  return `${base}/rooms/participants?roomIds=${encodeURIComponent(ids.join(','))}`;
}

/** Polls the token server for "who is in voice" per room. Also refreshes immediately when the
 *  local user joins or leaves a voice channel so the count updates without waiting for the next poll. */
export const useVoiceParticipantsPoll = () => {
  const selectedSpaceId = useSelectedSpace();
  const mx = useMatrixClient();
  const roomToParents = useAtomValue(roomToParentsAtom);
  const scopeFactory = useRecursiveChildScopeFactory(mx, roomToParents);
  const spaceRoomIds = useSpaceChildren(
    allRoomsAtom,
    selectedSpaceId ?? '',
    scopeFactory
  );
  const roomIds = selectedSpaceId ? spaceRoomIds : [];
  const settings = useAtomValue(voiceChannelSettingsAtom);
  const voiceRoomId = useAtomValue(voiceRoomIdAtom);
  const isConnected = useAtomValue(isVoiceConnectedAtom);
  const setByRoom = useSetAtom(voiceParticipantsByRoomAtom);

  // Main polling effect — always creates an interval regardless of initial fetch result
  useEffect(() => {
    if (!settings.livekitTokenEndpoint || settings.participantsApiEnabled !== true) return;
    const ids = Array.isArray(roomIds) ? roomIds : [];
    if (ids.length === 0) return;
    const url = buildParticipantsUrl(settings.livekitTokenEndpoint, ids);

    let cancelled = false;

    const fetchParticipants = async () => {
      try {
        const res = await fetch(url);
        if (res.ok && !cancelled) {
          const data = (await res.json()) as Record<string, string[]>;
          setByRoom(data);
        }
      } catch {
        // CORS, 404, etc.
      }
    };

    // Initial fetch
    void fetchParticipants();

    // Always start the interval — if the endpoint is flaky, it will recover on next tick
    const interval = setInterval(() => void fetchParticipants(), VOICE_PARTICIPANTS_POLL_MS);

    const onFocus = () => {
      void fetchParticipants();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [settings.livekitTokenEndpoint, settings.participantsApiEnabled, roomIds.join(','), setByRoom]);

  // Refresh participant list immediately when local user joins or leaves voice.
  // Small delay so the token server webhook has time to process the LiveKit event.
  useEffect(() => {
    if (!settings.livekitTokenEndpoint || settings.participantsApiEnabled !== true) return;
    const ids = Array.isArray(roomIds) ? roomIds : [];
    if (ids.length === 0) return;
    const url = buildParticipantsUrl(settings.livekitTokenEndpoint, ids);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as Record<string, string[]>;
          setByRoom(data);
        }
      } catch {
        // ignore
      }
    }, VOICE_PARTICIPANTS_JOIN_DELAY_MS);

    return () => clearTimeout(timer);
  }, [voiceRoomId, isConnected, settings.livekitTokenEndpoint, settings.participantsApiEnabled, roomIds.join(','), setByRoom]);
};

/** Mount once at app level to poll "who is in voice" for the room list. */
export function VoiceParticipantsPoller() {
  useVoiceParticipantsPoll();
  return null;
}
