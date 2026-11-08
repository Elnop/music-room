import type { TextStyle, ViewStyle } from 'react-native';
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

/** A row of a list: a framed tile with room under it. */
export const pixelRow = (theme: Theme): ViewStyle => ({
	...pixelFrame(theme),
	flexDirection: 'row',
	alignItems: 'center',
	gap: theme.spacing.md,
	padding: theme.spacing.sm,
	marginHorizontal: theme.spacing.md,
	marginBottom: theme.spacing.md,
	backgroundColor: theme.colors.surface,
});

/** The small label over a group of rows, in the pixel numbers font. */
export const pixelCaption = (theme: Theme): TextStyle => ({
	fontSize: theme.typography.sizes.xs,
	fontFamily: theme.typography.families.mono,
	color: theme.colors.textSecondary,
});
