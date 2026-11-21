import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/lib/types';

export function createEventScreenStyles(theme: Theme) {
	return StyleSheet.create({
		screen: { flex: 1, backgroundColor: theme.colors.background },
		body: { padding: theme.spacing.lg, gap: theme.spacing.lg },
	});
}
