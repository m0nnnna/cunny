import { keyframes, style } from '@vanilla-extract/css';
import { color, config, toRem } from 'folds';

export const VoiceChannelPanel = style({
  borderTop: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  borderRadius: `${config.radii.R400} ${config.radii.R400} 0 0`,
  overflow: 'hidden',
});

export const VoiceChannelCompact = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${config.space.S100} ${config.space.S200}`,
  gap: config.space.S200,
  minHeight: toRem(40),
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  borderTop: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  borderRadius: `${config.radii.R400} ${config.radii.R400} 0 0`,
});

export const VoiceChannelHeader = style({
  padding: `${config.space.S100} ${config.space.S200}`,
  borderBottom: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
});

export const VoiceChannelContent = style({
  padding: config.space.S200,
  minHeight: toRem(80),
  maxHeight: toRem(160),
  overflowY: 'auto',
  backgroundColor: color.Background.Container,
  color: color.Background.OnContainer,
});

export const VoiceChannelControls = style({
  padding: config.space.S100,
  borderTop: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
});

export const ParticipantTile = style({
  padding: `${config.space.S100} ${config.space.S200}`,
  borderRadius: config.radii.R300,
  transition: 'background-color 100ms',
  cursor: 'pointer',
  color: 'inherit',
  selectors: {
    '&:hover': {
      backgroundColor: color.Surface.ContainerHover,
    },
  },
});

export const ParticipantTileLocal = style({
  cursor: 'default',
});

export const ParticipantVolumeSlider = style({
  width: '100%',
  minWidth: toRem(120),
  accentColor: color.Primary.Main,
});

export const ParticipantAvatar = style({
  width: toRem(32),
  height: toRem(32),
  borderRadius: '50%',
  backgroundColor: color.Primary.Container,
  color: color.Primary.OnContainer,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const ParticipantSpeaking = style({
  boxShadow: `0 0 0 2px ${color.Success.Main}`,
});

export const VoiceButton = style({
  position: 'relative',
});

export const VoiceButtonActive = style({
  color: color.Success.Main,
});

export const VoiceButtonMuted = style({
  color: color.Critical.Main,
});

export const ConnectingSpinner = style({
  marginRight: config.space.S200,
});

export const ErrorMessage = style({
  padding: config.space.S300,
  color: color.Critical.Main,
  textAlign: 'center',
});

export const ErrorPanel = style({
  padding: config.space.S300,
  display: 'flex',
  flexDirection: 'column',
  gap: config.space.S200,
});

export const ErrorTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: config.space.S200,
  color: color.Critical.Main,
});

export const ErrorBody = style({
  fontSize: toRem(13),
  lineHeight: '1.45',
  color: color.Surface.OnContainer,
  opacity: 0.9,
});

export const ErrorStep = style({
  display: 'flex',
  gap: config.space.S200,
  alignItems: 'flex-start',
  padding: `${config.space.S100} 0`,
});

export const ErrorStepNumber = style({
  flexShrink: 0,
  width: toRem(20),
  height: toRem(20),
  borderRadius: '50%',
  backgroundColor: color.Critical.Container,
  color: color.Critical.OnContainer,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: toRem(11),
  fontWeight: 600,
});

export const ErrorCode = style({
  fontFamily: 'monospace',
  fontSize: toRem(12),
  backgroundColor: color.Background.Container,
  color: color.Background.OnContainer,
  padding: `${toRem(1)} ${toRem(6)}`,
  borderRadius: config.radii.R300,
  userSelect: 'all',
  wordBreak: 'break-all',
});

export const ErrorActions = style({
  display: 'flex',
  gap: config.space.S200,
  paddingTop: config.space.S100,
});

export const NoParticipants = style({
  padding: config.space.S400,
  textAlign: 'center',
  color: color.Background.OnContainer,
  opacity: 0.85,
});

/* ── Voice badge styles for room list ─────────────────────────────── */

/** Steady green glow when user is connected to voice in this room. */
export const VoiceBadgeActive = style({
  borderColor: color.Success.Main,
  boxShadow: `0 0 4px 1px ${color.Success.Main}`,
});

/** Pulsing glow when someone is actively speaking. */
const voiceBadgePulse = keyframes({
  '0%': { boxShadow: `0 0 4px 1px ${color.Success.Main}` },
  '50%': { boxShadow: `0 0 8px 3px ${color.Success.Main}` },
  '100%': { boxShadow: `0 0 4px 1px ${color.Success.Main}` },
});

export const VoiceBadgeSpeaking = style({
  animation: `${voiceBadgePulse} 1.2s ease-in-out infinite`,
  borderColor: color.Success.Main,
});
