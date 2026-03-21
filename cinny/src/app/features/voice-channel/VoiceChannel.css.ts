import { keyframes, style } from '@vanilla-extract/css';
import { color, config, toRem } from 'folds';

/* ── Keyframe animations ─────────────────────────────────────────── */

const slideInUp = keyframes({
  from: { opacity: 0, transform: 'translateY(10px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

/** Animated speaking ring — softer than a static glow. */
const avatarSpeakPulse = keyframes({
  '0%': { boxShadow: `0 0 0 2px ${color.Success.Main}` },
  '50%': { boxShadow: `0 0 0 4px ${color.Success.Main}, 0 0 10px ${color.Success.Main}` },
  '100%': { boxShadow: `0 0 0 2px ${color.Success.Main}` },
});

/* ── Panel layout ───────────────────────────────────────────────── */

/** Wrapper when voice panel is shown as a left sidebar (fixed width, main content to the right). */
export const VoiceChannelPanelSidebar = style({
  width: toRem(300),
  minWidth: toRem(260),
  maxWidth: toRem(360),
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  backgroundColor: color.Surface.Container,
});

export const VoiceChannelPanel = style({
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  borderRadius: config.radii.R400,
  overflow: 'hidden',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.18)',
  animation: `${slideInUp} 0.22s ease-out`,
});

export const VoiceChannelCompact = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexWrap: 'nowrap',
  padding: `${config.space.S100} ${config.space.S200}`,
  gap: config.space.S100,
  minHeight: toRem(44),
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  borderTop: `1px solid ${color.Surface.ContainerLine}`,
});

export const VoiceChannelContent = style({
  padding: config.space.S200,
  minHeight: toRem(48),
  maxHeight: toRem(140),
  overflowY: 'auto',
  backgroundColor: color.Background.Container,
  color: color.Background.OnContainer,
});

/* ── Participant tile ───────────────────────────────────────────── */

export const ParticipantTile = style({
  padding: `${config.space.S100} ${config.space.S200}`,
  borderRadius: config.radii.R400,
  transition: 'background-color 150ms ease, transform 120ms ease',
  cursor: 'pointer',
  color: 'inherit',
  selectors: {
    '&:hover': {
      backgroundColor: color.Surface.ContainerHover,
      transform: 'translateX(2px)',
    },
  },
});

export const ParticipantTileLocal = style({
  cursor: 'default',
  selectors: {
    '&:hover': {
      transform: 'none',
    },
  },
});

export const ParticipantVolumeSlider = style({
  width: '100%',
  minWidth: toRem(120),
  accentColor: color.Primary.Main,
});

export const ParticipantAvatar = style({
  width: toRem(36),
  height: toRem(36),
  borderRadius: '50%',
  backgroundColor: color.Primary.Container,
  color: color.Primary.OnContainer,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'box-shadow 200ms ease, border-color 200ms ease',
  border: `2px solid transparent`,
});

export const ParticipantSpeaking = style({
  animation: `${avatarSpeakPulse} 1.0s ease-in-out infinite`,
  border: `2px solid ${color.Success.Main}`,
});

/* ── Voice control buttons ──────────────────────────────────────── */

export const VoiceButton = style({
  position: 'relative',
  transition: 'transform 100ms ease',
  selectors: {
    '&:active': {
      transform: 'scale(0.92)',
    },
  },
});

export const VoiceButtonActive = style({
  color: color.Success.Main,
});

export const VoiceButtonMuted = style({
  color: color.Critical.Main,
});

/* ── Connection/loading states ──────────────────────────────────── */

export const ConnectingSpinner = style({
  marginRight: config.space.S200,
});

/* ── Error states ───────────────────────────────────────────────── */

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

/* ── Empty / no participants ────────────────────────────────────── */

export const NoParticipants = style({
  padding: config.space.S400,
  textAlign: 'center',
  color: color.Background.OnContainer,
  opacity: 0.7,
  animation: `${fadeIn} 0.3s ease-out`,
});

/* ── Screen share ───────────────────────────────────────────────── */

export const ScreenShareSection = style({
  borderTop: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  padding: config.space.S200,
  backgroundColor: color.Surface.Container,
  animation: `${slideInUp} 0.2s ease-out`,
});

export const ScreenShareVolumeRow = style({
  flexWrap: 'wrap',
});

export const ScreenShareVolumeSlider = style({
  width: toRem(120),
  minWidth: toRem(80),
  accentColor: color.Primary.Main,
});

export const ScreenShareHiddenBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${config.space.S100} ${config.space.S300}`,
  borderTop: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  gap: config.space.S200,
  minHeight: toRem(36),
  animation: `${slideInUp} 0.2s ease-out`,
});

export const ScreenSharePreview = style({
  position: 'relative',
  borderRadius: config.radii.R400,
  overflow: 'hidden',
  backgroundColor: '#000',
  cursor: 'zoom-in',
  aspectRatio: '16 / 9',
  maxHeight: toRem(200),
  width: '100%',
  transition: 'opacity 150ms ease, transform 150ms ease',
  selectors: {
    '&:hover': {
      opacity: 0.95,
      transform: 'scale(1.005)',
    },
  },
});

export const ScreenSharePreviewVideo = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

export const ScreenShareLabel = style({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: `${config.space.S200} ${config.space.S200}`,
  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.78))',
  color: '#fff',
  fontSize: toRem(12),
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: config.space.S100,
});

export const ScreenShareStopOverlay = style({
  position: 'absolute',
  top: config.space.S100,
  right: config.space.S100,
});

export const ScreenShareHideOverlay = style({
  position: 'absolute',
  top: config.space.S100,
  left: config.space.S100,
});

export const ScreenShareModalBackdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  backgroundColor: 'rgba(0, 0, 0, 0.88)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${fadeIn} 0.15s ease-out`,
  backdropFilter: 'blur(4px)',
});

export const ScreenShareModalHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  maxWidth: '90vw',
  padding: `${config.space.S200} ${config.space.S300}`,
  color: '#fff',
});

export const ScreenShareModalVideo = style({
  maxWidth: '90vw',
  maxHeight: '80vh',
  objectFit: 'contain',
  borderRadius: config.radii.R400,
  backgroundColor: '#000',
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.6)',
});

export const ScreenShareButtonSharing = style({
  color: color.Success.Main,
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
