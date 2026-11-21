import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createEventScreenStyles(theme: Theme) {
	const styles = StyleSheet.create({
		screen: { flex: 1, backgroundColor: theme.colors.background },
		body: { padding: theme.spacing.lg, gap: theme.spacing.lg },
	});
	return styles;
}
