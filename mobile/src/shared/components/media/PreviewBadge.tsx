import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';

/** Marks a track SoundCloud only serves as a 30-second preview. */
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
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.warning,
			borderWidth: 1,
			borderColor: theme.colors.warning,
			borderRadius: 4,
			paddingHorizontal: 4,
			overflow: 'hidden',
		},
	});
