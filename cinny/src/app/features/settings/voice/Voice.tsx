import React, { FormEventHandler, useEffect, useState } from 'react';
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
import { useVoiceChannelSettings, useUpdateVoiceChannelSettings } from '../../../state/hooks/voiceChannel';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import { SequenceCardStyle } from '../styles.css';

type MediaDevice = { deviceId: string; label: string; kind: MediaDeviceKind };

type VoiceProps = {
  requestClose: () => void;
};

export function Voice({ requestClose }: VoiceProps) {
  const screenSize = useScreenSizeContext();
  const [settings] = useVoiceChannelSettings();
  const updateSettings = useUpdateVoiceChannelSettings();

  const [serverUrl, setServerUrl] = useState(settings.livekitServerUrl);
  const [tokenEndpoint, setTokenEndpoint] = useState(settings.livekitTokenEndpoint);
  const [saved, setSaved] = useState(false);

  // URLs injected by Docker entrypoint — these are auto-configured and shouldn't need manual entry
  const injectedServerUrl = typeof window !== 'undefined' && window.__VOICE_CONFIG__?.livekitServerUrl;
  const injectedTokenEndpoint = typeof window !== 'undefined' && window.__VOICE_CONFIG__?.tokenEndpoint;
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
            .map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`, kind: d.kind }))
        );
        setOutputDevices(
          devices
            .filter((d) => d.kind === 'audiooutput')
            .map((d) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`, kind: d.kind }))
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

  const handleSave: FormEventHandler = (evt) => {
    evt.preventDefault();
    updateSettings({
      livekitServerUrl: serverUrl,
      livekitTokenEndpoint: tokenEndpoint,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
              <Box direction="Column" gap="100">
                <Text size="L400" priority="300">
                  LiveKit Configuration
                </Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  {isAutoConfigured && (
                    <Box gap="200" alignItems="Center" style={{ padding: `${config.space.S100} 0` }}>
                      <Icon src={Icons.Check} size="100" />
                      <Text size="T200" priority="400">
                        Auto-configured by server. Override below if needed.
                      </Text>
                    </Box>
                  )}
                  <form onSubmit={handleSave}>
                    <Box direction="Column" gap="400">
                      <SettingTile
                        title="LiveKit Server URL"
                        description={isAutoConfigured
                          ? `Auto-configured: ${injectedServerUrl}`
                          : 'WebSocket URL for your LiveKit server (e.g., wss://livekit.example.com)'}
                      >
                        <Input
                          variant="Background"
                          size="400"
                          radii="300"
                          style={{ width: '100%', maxWidth: '400px' }}
                          value={serverUrl}
                          onChange={(e) => setServerUrl(e.target.value)}
                          placeholder={injectedServerUrl || 'wss://your-livekit-server.com'}
                        />
                      </SettingTile>

                      <SettingTile
                        title="Token Endpoint"
                        description={isAutoConfigured
                          ? `Auto-configured: ${injectedTokenEndpoint}`
                          : 'URL of your token generation endpoint for authentication'}
                      >
                        <Input
                          variant="Background"
                          size="400"
                          radii="300"
                          style={{ width: '100%', maxWidth: '400px' }}
                          value={tokenEndpoint}
                          onChange={(e) => setTokenEndpoint(e.target.value)}
                          placeholder={injectedTokenEndpoint || 'https://your-server.com/api/livekit/token'}
                        />
                      </SettingTile>

                      <Box gap="200" alignItems="Center">
                        <Button
                          type="submit"
                          variant="Primary"
                          size="300"
                          before={<Icon src={Icons.Check} size="100" />}
                        >
                          <Text size="B400">Save Settings</Text>
                        </Button>
                        {saved && (
                          <Text size="T200" priority="400">
                            Settings saved!
                          </Text>
                        )}
                      </Box>
                    </Box>
                  </form>
                </SequenceCard>
              </Box>

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
                        onChange={(value) => updateSettings({ participantsApiEnabled: value })}
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
                        onChange={(value) => updateSettings({ joinMuted: value })}
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
                        onChange={(value) => updateSettings({ pushToTalk: value })}
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
                          if (code && code !== 'Tab') updateSettings({ pushToTalkKey: code });
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
                          background: 'var(--color-surface-container, #222)',
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
                          background: 'var(--color-surface-container, #222)',
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
                    <Box alignItems="Center" gap="200" style={{ maxWidth: '400px' }}>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((settings.inputVolume ?? 1) * 100)}
                        onChange={(e) =>
                          updateSettings({
                            inputVolume: Number(e.target.value) / 100,
                          })
                        }
                        style={{ flex: 1, accentColor: 'var(--color-primary, #0cf)' }}
                      />
                      <Text size="T300">{Math.round((settings.inputVolume ?? 1) * 100)}%</Text>
                    </Box>
                  </SettingTile>

                  <SettingTile
                    title="Speaker level"
                    description="Volume for other participants"
                  >
                    <Box alignItems="Center" gap="200" style={{ maxWidth: '400px' }}>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((settings.outputVolume ?? 1) * 100)}
                        onChange={(e) =>
                          updateSettings({
                            outputVolume: Number(e.target.value) / 100,
                          })
                        }
                        style={{ flex: 1, accentColor: 'var(--color-primary, #0cf)' }}
                      />
                      <Text size="T300">{Math.round((settings.outputVolume ?? 1) * 100)}%</Text>
                    </Box>
                  </SettingTile>
                </SequenceCard>
              </Box>

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
                    To enable voice channels, you need to set up a LiveKit server:
                  </Text>
                  <Box direction="Column" gap="200" style={{ paddingLeft: config.space.S300 }}>
                    <Text size="T300">
                      1. Self-host LiveKit server or use LiveKit Cloud
                    </Text>
                    <Text size="T300">
                      2. Create a token endpoint on your backend that generates LiveKit tokens
                    </Text>
                    <Text size="T300">
                      3. Enter the server URL and token endpoint above
                    </Text>
                  </Box>
                  <Box style={{ marginTop: config.space.S200 }}>
                    <Text size="T200" priority="300">
                      Learn more at docs.livekit.io
                    </Text>
                  </Box>
                </SequenceCard>
              </Box>

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
                    <Text size="T200" style={{ paddingLeft: config.space.S300 }}>
                      "roomName": "matrix-!roomId:server.com",
                    </Text>
                    <Text size="T200" style={{ paddingLeft: config.space.S300 }}>
                      "participantName": "User Display Name"
                    </Text>
                    <Text size="T200">{'}'}</Text>
                  </Box>
                  <Text size="T300" style={{ marginTop: config.space.S200 }}>
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
                    <Text size="T200">{'{ "token": "eyJhbGciOiJIUzI1NiIs..." }'}</Text>
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
