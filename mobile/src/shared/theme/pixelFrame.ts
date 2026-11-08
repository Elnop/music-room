import type { TextStyle, ViewStyle } from 'react-native';
import type { Theme } from './types';

export const pixelFrame = (theme: Theme): ViewStyle => ({
	borderWidth: theme.borders.thick,
	borderColor: theme.colors.border,
});

export const keycap = (theme: Theme): ViewStyle => ({
	...pixelFrame(theme),
	borderBottomWidth: theme.borders.thick * 3,
});

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

export const pixelCaption = (theme: Theme): TextStyle => ({
	fontSize: theme.typography.sizes.xs,
	fontFamily: theme.typography.families.mono,
	color: theme.colors.textSecondary,
});
