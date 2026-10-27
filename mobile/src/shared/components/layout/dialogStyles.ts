import type { TextStyle, ViewStyle } from 'react-native';
import type { Theme } from '@/shared/theme/types';

/** The padding and the title of a dialog's content inside CenteredDialog. */
export const dialogStyles = (theme: Theme): { body: ViewStyle; title: TextStyle } => ({
	body: { padding: theme.spacing.lg },
	title: {
		fontSize: theme.typography.sizes.xl,
		fontFamily: theme.typography.families.bold,
		color: theme.colors.text,
	},
});
