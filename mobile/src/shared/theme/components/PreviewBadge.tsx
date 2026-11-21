import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { Text } from '@/shared/theme/components/Text';

export function PreviewBadge() {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<Text style={styles.badge} accessibilityLabel="Extrait de 30 secondes" testID="preview-badge">
			Extrait
		</Text>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		badge: {
			alignSelf: 'flex-start',
			fontSize: theme.typography.sizes.xs,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.warning,
			borderWidth: 1,
			borderColor: theme.colors.warning,
			paddingHorizontal: 4,
			overflow: 'hidden',
		},
	});
}
