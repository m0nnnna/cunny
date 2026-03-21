import { style } from '@vanilla-extract/css';
import { color, config } from 'folds';

export const ModalWide = style({
  minWidth: '85vw',
  minHeight: '90vh',
});

/** Container for the image viewer — sizes to content, capped at 92vw/vh. */
export const ImageViewerModal = style({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '92vw',
  maxHeight: '92vh',
  borderRadius: config.radii.R400,
  overflow: 'hidden',
  boxShadow: config.shadow.E400,
  backgroundColor: color.Surface.Container,
  color: color.Surface.OnContainer,
  border: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
});
