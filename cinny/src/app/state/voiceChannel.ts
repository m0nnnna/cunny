import { atom } from 'jotai';
import { atomWithLocalStorage, getLocalStorageItem, setLocalStorageItem } from './utils/atomWithLocalStorage';

const VOICE_SETTINGS_KEY = 'voiceChannelSettings';

export interface VoiceChannelSettings {
  livekitServerUrl: string;
  livekitTokenEndpoint: string;
  /** If false, do not call /rooms/participants (avoids CORS/404 when token server lacks this API). */
  participantsApiEnabled: boolean;
  inputDeviceId?: string;
  outputDeviceId?: string;
  inputVolume: number;
  outputVolume: number;
  /** If true, join voice channels muted by default. */
  joinMuted: boolean;
  /** If true, hold the push-to-talk key to unmute; release to mute. */
  pushToTalk: boolean;
  /** Keyboard key for push-to-talk (e.g. 'KeyV' for V). Stored as KeyboardEvent.code. */
  pushToTalkKey: string;
}

// Check for injected config from Docker environment
interface VoiceConfig {
  livekitServerUrl?: string;
  tokenEndpoint?: string;
}

declare global {
  interface Window {
    __VOICE_CONFIG__?: VoiceConfig;
  }
}

const getInjectedConfig = (): Partial<VoiceChannelSettings> => {
  if (typeof window !== 'undefined' && window.__VOICE_CONFIG__) {
    return {
      livekitServerUrl: window.__VOICE_CONFIG__.livekitServerUrl || '',
      livekitTokenEndpoint: window.__VOICE_CONFIG__.tokenEndpoint || '',
    };
  }
  return {};
};

const defaultVoiceSettings: VoiceChannelSettings = {
  livekitServerUrl: '',
  livekitTokenEndpoint: '',
  participantsApiEnabled: true,
  inputDeviceId: undefined,
  outputDeviceId: undefined,
  inputVolume: 1,
  outputVolume: 1,
  joinMuted: false,
  pushToTalk: false,
  pushToTalkKey: 'KeyV',
  ...getInjectedConfig(),
};

/**
 * Load voice settings from localStorage but ALWAYS override server URL and token endpoint
 * with Docker-injected values (from __VOICE_CONFIG__) when they are present.
 * This way users never have to manually enter URLs that are already in the deployment config.
 */
function loadVoiceSettings(key: string): VoiceChannelSettings {
  const stored = getLocalStorageItem(key, defaultVoiceSettings);
  const injected = getInjectedConfig();

  // Always prefer injected (Docker) URLs over whatever is in localStorage
  if (injected.livekitServerUrl) {
    stored.livekitServerUrl = injected.livekitServerUrl;
  }
  if (injected.livekitTokenEndpoint) {
    stored.livekitTokenEndpoint = injected.livekitTokenEndpoint;
  }
  // Ensure participantsApiEnabled defaults to true for existing installs that had it off
  if (stored.participantsApiEnabled === undefined) {
    stored.participantsApiEnabled = true;
  }
  return stored;
}

export const voiceChannelSettingsAtom = atomWithLocalStorage<VoiceChannelSettings>(
  VOICE_SETTINGS_KEY,
  loadVoiceSettings,
  setLocalStorageItem
);

// Voice connection state
export interface VoiceConnectionState {
  roomId: string | null;
  roomName: string | null;
  token: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  error: string | null;
}

const defaultVoiceConnectionState: VoiceConnectionState = {
  roomId: null,
  roomName: null,
  token: null,
  isConnected: false,
  isConnecting: false,
  isMuted: false,
  isDeafened: false,
  error: null,
};

const baseVoiceConnectionAtom = atom<VoiceConnectionState>(defaultVoiceConnectionState);

export type VoiceConnectionAction =
  | { type: 'CONNECT_START'; roomId: string; roomName: string }
  | { type: 'CONNECT_SUCCESS'; token: string; joinMuted?: boolean }
  | { type: 'CONNECT_ERROR'; error: string }
  | { type: 'DISCONNECT' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_MUTE'; muted: boolean }
  | { type: 'TOGGLE_DEAFEN' }
  | { type: 'SET_DEAFEN'; deafened: boolean };

export const voiceConnectionAtom = atom<VoiceConnectionState, [VoiceConnectionAction], void>(
  (get) => get(baseVoiceConnectionAtom),
  (get, set, action) => {
    const current = get(baseVoiceConnectionAtom);

    switch (action.type) {
      case 'CONNECT_START':
        set(baseVoiceConnectionAtom, {
          ...defaultVoiceConnectionState,
          roomId: action.roomId,
          roomName: action.roomName,
          isConnecting: true,
        });
        break;

      case 'CONNECT_SUCCESS':
        set(baseVoiceConnectionAtom, {
          ...current,
          token: action.token,
          isConnected: true,
          isConnecting: false,
          error: null,
          isMuted: action.joinMuted ?? current.isMuted,
        });
        break;

      case 'CONNECT_ERROR':
        set(baseVoiceConnectionAtom, {
          ...current,
          isConnected: false,
          isConnecting: false,
          error: action.error,
        });
        break;

      case 'DISCONNECT':
        set(baseVoiceConnectionAtom, defaultVoiceConnectionState);
        break;

      case 'TOGGLE_MUTE':
        set(baseVoiceConnectionAtom, {
          ...current,
          isMuted: !current.isMuted,
        });
        break;

      case 'SET_MUTE':
        set(baseVoiceConnectionAtom, {
          ...current,
          isMuted: action.muted,
        });
        break;

      case 'TOGGLE_DEAFEN':
        set(baseVoiceConnectionAtom, {
          ...current,
          isDeafened: !current.isDeafened,
          // If deafening, also mute
          isMuted: !current.isDeafened ? true : current.isMuted,
        });
        break;

      case 'SET_DEAFEN':
        set(baseVoiceConnectionAtom, {
          ...current,
          isDeafened: action.deafened,
          isMuted: action.deafened ? true : current.isMuted,
        });
        break;
    }
  }
);

// Derived atoms for convenience
export const isVoiceConnectedAtom = atom((get) => get(voiceConnectionAtom).isConnected);
export const isVoiceConnectingAtom = atom((get) => get(voiceConnectionAtom).isConnecting);
export const voiceRoomIdAtom = atom((get) => get(voiceConnectionAtom).roomId);
export const isMutedAtom = atom((get) => get(voiceConnectionAtom).isMuted);
export const isDeafenedAtom = atom((get) => get(voiceConnectionAtom).isDeafened);

/** Room ID -> list of Matrix user IDs currently in that room's voice channel. Filled by polling the token server. */
export const voiceParticipantsByRoomAtom = atom<Record<string, string[]>>({});

/** Per-participant volume (identity -> 0..1). "Mute for me" sets to 0. Used only in current call. */
export const voiceParticipantVolumesAtom = atom<Record<string, number>>({});

/** Room ID -> true when anyone in that room's voice call is currently speaking.
 *  Written by VoiceParticipantList, consumed by room-list badge for glow animation. */
export const voiceSpeakingAtom = atom<Record<string, boolean>>({});
