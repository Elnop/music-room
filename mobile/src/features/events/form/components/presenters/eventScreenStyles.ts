import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

/** The scrolling page of the event form and detail. */
export const createEventScreenStyles = (theme: Theme) =>
	StyleSheet.create({
		screen: { flex: 1, backgroundColor: theme.colors.background },
		body: { padding: theme.spacing.lg, gap: theme.spacing.lg },
	});
