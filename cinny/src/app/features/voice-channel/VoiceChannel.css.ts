import { keyframes, style } from '@vanilla-extract/css';
import { color, config, toRem } from 'folds';

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
  borderTop: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  borderRadius: `${config.radii.R400} ${config.radii.R400} 0 0`,
  overflow: 'hidden',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
});

export const VoiceChannelCompact = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  flexWrap: 'nowrap',
  padding: `${config.space.S100} ${config.space.S200}`,
  gap: config.space.S100,
  minHeight: toRem(36),
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  borderTop: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  borderRadius: `${config.radii.R400} ${config.radii.R400} 0 0`,
});

export const VoiceChannelContent = style({
  padding: config.space.S200,
  minHeight: toRem(48),
  maxHeight: toRem(120),
  overflowY: 'auto',
  backgroundColor: color.Background.Container,
  color: color.Background.OnContainer,
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

/* ── Screenshare styles ───────────────────────────────────────────── */

export const ScreenShareSection = style({
  borderTop: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  padding: config.space.S200,
  backgroundColor: color.Surface.Container,
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
  padding: `${config.space.S100} ${config.space.S200}`,
  borderTop: `${config.borderWidth.B200} solid ${color.Surface.ContainerLine}`,
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  gap: config.space.S200,
  minHeight: toRem(32),
});

export const ScreenSharePreview = style({
  position: 'relative',
  borderRadius: config.radii.R300,
  overflow: 'hidden',
  backgroundColor: '#000',
  cursor: 'pointer',
  aspectRatio: '16 / 9',
  maxHeight: toRem(140),
  width: '100%',
  selectors: {
    '&:hover': {
      opacity: 0.92,
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
  padding: `${config.space.S100} ${config.space.S200}`,
  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  color: '#fff',
  fontSize: toRem(12),
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
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
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
  borderRadius: config.radii.R300,
  backgroundColor: '#000',
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
