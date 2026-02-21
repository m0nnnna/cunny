import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  config,
  Icon,
  IconButton,
  Icons,
  Input,
  Scroll,
  Switch,
  Text,
} from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SettingTile } from '../../../components/setting-tile';
import {
  useVoiceChannelSettings,
  useUpdateVoiceChannelSettings,
  useVoiceServerProfiles,
} from '../../../state/hooks/voiceChannel';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import { SequenceCardStyle } from '../styles.css';
import { VoiceServerProfile } from '../../../state/voiceChannel';

type MediaDevice = { deviceId: string; label: string; kind: MediaDeviceKind };

type VoiceProps = {
  requestClose: () => void;
};

type ProfileFormData = {
  name: string;
  livekitServerUrl: string;
  livekitTokenEndpoint: string;
};

export function Voice({ requestClose }: VoiceProps) {
  const screenSize = useScreenSizeContext();
  const [settings] = useVoiceChannelSettings();
  const updateSettings = useUpdateVoiceChannelSettings();
  const {
    profiles,
    defaultProfileId,
    addProfile,
    updateProfile,
    removeProfile,
    setDefault,
  } = useVoiceServerProfiles();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    livekitServerUrl: '',
    livekitTokenEndpoint: '',
  });

  const injectedServerUrl =
    typeof window !== 'undefined' && window.__VOICE_CONFIG__?.livekitServerUrl;
  const injectedTokenEndpoint =
    typeof window !== 'undefined' && window.__VOICE_CONFIG__?.tokenEndpoint;
  const isAutoConfigured = !!(injectedServerUrl && injectedTokenEndpoint);

  const [inputDevices, setInputDevices] = useState<MediaDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDevice[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        setInputDevices(
          devices
            .filter((d) => d.kind === 'audioinput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
              kind: d.kind,
            }))
        );
        setOutputDevices(
          devices
            .filter((d) => d.kind === 'audiooutput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
              kind: d.kind,
            }))
        );
      } catch {
        if (!cancelled) setInputDevices([]);
        if (!cancelled) setOutputDevices([]);
      }
    };
    loadDevices();
    return () => {
      cancelled = true;
    };
  }, []);

  const startEdit = useCallback((profile: VoiceServerProfile) => {
    setEditingId(profile.id);
    setAddingNew(false);
    setFormData({
      name: profile.name,
      livekitServerUrl: profile.livekitServerUrl,
      livekitTokenEndpoint: profile.livekitTokenEndpoint,
    });
  }, []);

  const startAdd = useCallback(() => {
    setAddingNew(true);
    setEditingId(null);
    setFormData({ name: '', livekitServerUrl: '', livekitTokenEndpoint: '' });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setAddingNew(false);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingId && formData.name.trim()) {
      updateProfile(editingId, {
        name: formData.name.trim(),
        livekitServerUrl: formData.livekitServerUrl.trim(),
        livekitTokenEndpoint: formData.livekitTokenEndpoint.trim(),
      });
      setEditingId(null);
    }
  }, [editingId, formData, updateProfile]);

  const saveNew = useCallback(() => {
    if (formData.name.trim() && formData.livekitServerUrl.trim()) {
      addProfile({
        name: formData.name.trim(),
        livekitServerUrl: formData.livekitServerUrl.trim(),
        livekitTokenEndpoint: formData.livekitTokenEndpoint.trim(),
      });
      setAddingNew(false);
      setFormData({ name: '', livekitServerUrl: '', livekitTokenEndpoint: '' });
    }
  }, [formData, addProfile]);

  const renderProfileForm = (isNew: boolean) => (
    <Box direction="Column" gap="300" style={{ padding: `${config.space.S300} 0` }}>
      <SettingTile title="Name">
        <Input
          variant="Background"
          size="400"
          radii="300"
          style={{ width: '100%', maxWidth: '400px' }}
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g. Home Server"
          autoFocus
        />
      </SettingTile>
      <SettingTile
        title="LiveKit Server URL"
        description="WebSocket URL (wss://...)"
      >
        <Input
          variant="Background"
          size="400"
          radii="300"
          style={{ width: '100%', maxWidth: '400px' }}
          value={formData.livekitServerUrl}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              livekitServerUrl: e.target.value,
            }))
          }
          placeholder="wss://livekit.example.com"
        />
      </SettingTile>
      <SettingTile
        title="Token Endpoint"
        description="URL for authentication tokens"
      >
        <Input
          variant="Background"
          size="400"
          radii="300"
          style={{ width: '100%', maxWidth: '400px' }}
          value={formData.livekitTokenEndpoint}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              livekitTokenEndpoint: e.target.value,
            }))
          }
          placeholder="https://example.com/api/livekit/token"
        />
      </SettingTile>
      <Box gap="200">
        <Button
          variant="Primary"
          size="300"
          onClick={isNew ? saveNew : saveEdit}
          before={<Icon src={Icons.Check} size="100" />}
        >
          <Text size="B400">{isNew ? 'Add' : 'Save'}</Text>
        </Button>
        <Button variant="Secondary" size="300" onClick={cancelEdit}>
          <Text size="B400">Cancel</Text>
        </Button>
      </Box>
    </Box>
  );

  return (
    <Page>
      <PageHeader outlined={screenSize !== ScreenSize.Mobile}>
        <Box grow="Yes" gap="200">
          {screenSize === ScreenSize.Mobile && (
            <IconButton onClick={requestClose}>
              <Icon src={Icons.ArrowLeft} />
            </IconButton>
          )}
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Voice Channels
            </Text>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              {/* ── Voice Servers (address book) ───────────────────── */}
              <Box direction="Column" gap="100">
                <Text size="L400" priority="300">
                  Voice Servers
                </Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="100"
                >
                  {isAutoConfigured && profiles.length === 0 && (
                    <Box
                      gap="200"
                      alignItems="Center"
                      style={{ padding: `${config.space.S200} 0` }}
                    >
                      <Icon src={Icons.Check} size="100" />
                      <Text size="T200" priority="400">
                        Auto-configured by server. Add more servers below to
                        connect to others.
                      </Text>
                    </Box>
                  )}

                  {profiles.length === 0 && !isAutoConfigured && (
                    <Box style={{ padding: `${config.space.S200} 0` }}>
                      <Text size="T300" priority="300">
                        No voice servers configured. Add one to enable voice
                        channels.
                      </Text>
                    </Box>
                  )}

                  {profiles.map((profile) =>
                    editingId === profile.id ? (
                      <React.Fragment key={profile.id}>
                        {renderProfileForm(false)}
                      </React.Fragment>
                    ) : (
                      <Box
                        key={profile.id}
                        alignItems="Center"
                        gap="200"
                        style={{
                          padding: `${config.space.S200} 0`,
                          borderBottom: `1px solid color-mix(in srgb, currentColor 12%, transparent)`,
                        }}
                      >
                        <Box
                          direction="Column"
                          grow="Yes"
                          style={{ minWidth: 0 }}
                        >
                          <Box alignItems="Center" gap="100">
                            {profile.id === defaultProfileId && (
                              <Text size="T200" priority="400">
                                {'\u2605'}
                              </Text>
                            )}
                            <Text
                              size="T300"
                              style={{
                                fontWeight:
                                  profile.id === defaultProfileId ? 600 : 400,
                              }}
                            >
                              {profile.name}
                            </Text>
                          </Box>
                          <Text size="T200" priority="300" truncate>
                            {profile.livekitServerUrl}
                          </Text>
                        </Box>
                        <Box
                          gap="100"
                          alignItems="Center"
                          style={{ flexShrink: 0 }}
                        >
                          {profile.id !== defaultProfileId && (
                            <Button
                              size="300"
                              variant="Secondary"
                              radii="300"
                              onClick={() => setDefault(profile.id)}
                            >
                              <Text size="T200">Set Default</Text>
                            </Button>
                          )}
                          <Button
                            size="300"
                            variant="Secondary"
                            radii="300"
                            onClick={() => startEdit(profile)}
                          >
                            <Text size="T200">Edit</Text>
                          </Button>
                          <IconButton
                            size="300"
                            variant="Critical"
                            fill="None"
                            radii="300"
                            onClick={() => removeProfile(profile.id)}
                            aria-label="Remove"
                          >
                            <Icon size="100" src={Icons.Cross} />
                          </IconButton>
                        </Box>
                      </Box>
                    )
                  )}

                  {addingNew ? (
                    renderProfileForm(true)
                  ) : (
                    <Box style={{ padding: `${config.space.S200} 0` }}>
                      <Button
                        variant="Secondary"
                        size="300"
                        onClick={startAdd}
                      >
                        <Text size="B400">+ Add Server</Text>
                      </Button>
                    </Box>
                  )}
                </SequenceCard>
              </Box>

              {/* ── Voice behavior & devices ───────────────────────── */}
              <Box direction="Column" gap="100">
                <Text size="L400" priority="300">
                  Voice behavior & devices
                </Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Show who's in voice"
                    description="Show participant counts on room list. Fetches from the token server and updates when you join or leave."
                    after={
                      <Switch
                        variant="Primary"
                        value={settings.participantsApiEnabled === true}
                        onChange={(value) =>
                          updateSettings({ participantsApiEnabled: value })
                        }
                      />
                    }
                  />

                  <SettingTile
                    title="Join voice channels muted"
                    description="Start muted when joining so you don't broadcast until you're ready"
                    after={
                      <Switch
                        variant="Primary"
                        value={settings.joinMuted ?? false}
                        onChange={(value) =>
                          updateSettings({ joinMuted: value })
                        }
                      />
                    }
                  />

                  <SettingTile
                    title="Push to talk"
                    description="Hold a key to talk; release to mute. When on, you stay muted until you press the key."
                    after={
                      <Switch
                        variant="Primary"
                        value={settings.pushToTalk ?? false}
                        onChange={(value) =>
                          updateSettings({ pushToTalk: value })
                        }
                      />
                    }
                  />

                  {settings.pushToTalk && (
                    <SettingTile
                      title="Push to talk key"
                      description="Press the key you want to use (e.g. V). Focus the box and press a key."
                    >
                      <Input
                        variant="Background"
                        size="400"
                        radii="300"
                        style={{ width: '120px' }}
                        value={settings.pushToTalkKey ?? 'KeyV'}
                        onKeyDown={(e) => {
                          e.preventDefault();
                          const code = e.code;
                          if (code && code !== 'Tab')
                            updateSettings({ pushToTalkKey: code });
                        }}
                        readOnly
                        placeholder="Press a key"
                      />
                    </SettingTile>
                  )}

                  <SettingTile
                    title="Microphone"
                    description="Device used for your voice"
                  >
                    <Box style={{ maxWidth: '400px' }}>
                      <select
                        value={settings.inputDeviceId ?? ''}
                        onChange={(e) =>
                          updateSettings({
                            inputDeviceId: e.target.value || undefined,
                          })
                        }
                        style={{
                          width: '100%',
                          padding: config.space.S200,
                          borderRadius: config.radii.R300,
                          border: `1px solid var(--color-border, #333)`,
                          background:
                            'var(--color-surface-container, #222)',
                          color: 'inherit',
                          fontSize: 'inherit',
                        }}
                      >
                        <option value="">Default microphone</option>
                        {inputDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </Box>
                  </SettingTile>

                  <SettingTile
                    title="Speaker"
                    description="Device for hearing others"
                  >
                    <Box style={{ maxWidth: '400px' }}>
                      <select
                        value={settings.outputDeviceId ?? ''}
                        onChange={(e) =>
                          updateSettings({
                            outputDeviceId: e.target.value || undefined,
                          })
                        }
                        style={{
                          width: '100%',
                          padding: config.space.S200,
                          borderRadius: config.radii.R300,
                          border: `1px solid var(--color-border, #333)`,
                          background:
                            'var(--color-surface-container, #222)',
                          color: 'inherit',
                          fontSize: 'inherit',
                        }}
                      >
                        <option value="">Default speaker</option>
                        {outputDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </Box>
                  </SettingTile>

                  <SettingTile
                    title="Microphone level"
                    description="Input volume (saved for future use)"
                  >
                    <Box
                      alignItems="Center"
                      gap="200"
                      style={{ maxWidth: '400px' }}
                    >
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(
                          (settings.inputVolume ?? 1) * 100
                        )}
                        onChange={(e) =>
                          updateSettings({
                            inputVolume: Number(e.target.value) / 100,
                          })
                        }
                        style={{
                          flex: 1,
                          accentColor: 'var(--color-primary, #0cf)',
                        }}
                      />
                      <Text size="T300">
                        {Math.round((settings.inputVolume ?? 1) * 100)}%
                      </Text>
                    </Box>
                  </SettingTile>

                  <SettingTile
                    title="Speaker level"
                    description="Volume for other participants"
                  >
                    <Box
                      alignItems="Center"
                      gap="200"
                      style={{ maxWidth: '400px' }}
                    >
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(
                          (settings.outputVolume ?? 1) * 100
                        )}
                        onChange={(e) =>
                          updateSettings({
                            outputVolume: Number(e.target.value) / 100,
                          })
                        }
                        style={{
                          flex: 1,
                          accentColor: 'var(--color-primary, #0cf)',
                        }}
                      />
                      <Text size="T300">
                        {Math.round((settings.outputVolume ?? 1) * 100)}%
                      </Text>
                    </Box>
                  </SettingTile>
                </SequenceCard>
              </Box>

              {/* ── Setup Guide ────────────────────────────────────── */}
              <Box direction="Column" gap="100">
                <Text size="L400" priority="300">
                  Setup Guide
                </Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="300"
                >
                  <Text size="T300">
                    To enable voice channels, you need to set up a LiveKit
                    server:
                  </Text>
                  <Box
                    direction="Column"
                    gap="200"
                    style={{ paddingLeft: config.space.S300 }}
                  >
                    <Text size="T300">
                      1. Self-host LiveKit server or use LiveKit Cloud
                    </Text>
                    <Text size="T300">
                      2. Create a token endpoint on your backend that generates
                      LiveKit tokens
                    </Text>
                    <Text size="T300">
                      3. Add the server in Voice Servers above
                    </Text>
                  </Box>
                  <Box style={{ marginTop: config.space.S200 }}>
                    <Text size="T200" priority="300">
                      Learn more at docs.livekit.io
                    </Text>
                  </Box>
                </SequenceCard>
              </Box>

              {/* ── Token Endpoint Requirements ────────────────────── */}
              <Box direction="Column" gap="100">
                <Text size="L400" priority="300">
                  Token Endpoint Requirements
                </Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="300"
                >
                  <Text size="T300">
                    Your token endpoint should accept POST requests with:
                  </Text>
                  <Box
                    style={{
                      padding: config.space.S200,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      borderRadius: config.radii.R300,
                      fontFamily: 'monospace',
                    }}
                    direction="Column"
                    gap="100"
                  >
                    <Text size="T200">{'{'}</Text>
                    <Text
                      size="T200"
                      style={{ paddingLeft: config.space.S300 }}
                    >
                      "roomName": "matrix-!roomId:server.com",
                    </Text>
                    <Text
                      size="T200"
                      style={{ paddingLeft: config.space.S300 }}
                    >
                      "participantName": "User Display Name"
                    </Text>
                    <Text size="T200">{'}'}</Text>
                  </Box>
                  <Text
                    size="T300"
                    style={{ marginTop: config.space.S200 }}
                  >
                    And return:
                  </Text>
                  <Box
                    style={{
                      padding: config.space.S200,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      borderRadius: config.radii.R300,
                      fontFamily: 'monospace',
                    }}
                    direction="Column"
                    gap="100"
                  >
                    <Text size="T200">
                      {'{ "token": "eyJhbGciOiJIUzI1NiIs..." }'}
                    </Text>
                  </Box>
                </SequenceCard>
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}

export default Voice;
