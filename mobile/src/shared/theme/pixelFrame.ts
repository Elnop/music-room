import type { ViewStyle } from 'react-native';
import type { Theme } from './types';

/** The pixel outline drawn around cards, covers and fields. */
export const pixelFrame = (theme: Theme): ViewStyle => ({
	borderWidth: theme.borders.thick,
	borderColor: theme.colors.border,
});

/** A keyboard key: the pixel outline with a thick bottom edge that reads as depth. */
export const keycap = (theme: Theme): ViewStyle => ({
	...pixelFrame(theme),
	borderBottomWidth: theme.borders.thick * 3,
});
