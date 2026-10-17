import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';

/** Marks a track SoundCloud only serves as a 30-second preview (#307). */
export function PreviewBadge() {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<Text style={styles.badge} accessibilityLabel="Extrait de 30 secondes" testID="preview-badge">
			Extrait
		</Text>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		badge: {
			alignSelf: 'flex-start',
			fontSize: theme.typography.sizes.xs,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.warning,
			borderWidth: 1,
			borderColor: theme.colors.warning,
			borderRadius: 4,
			paddingHorizontal: 4,
			overflow: 'hidden',
		},
	});
