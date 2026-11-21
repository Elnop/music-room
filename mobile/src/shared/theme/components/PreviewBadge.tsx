import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
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
	const styles = StyleSheet.create({
		badge: {
			alignSelf: 'flex-start',
			fontSize: theme.typography.sizes.xs,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.warning,
			borderWidth: theme.borders.hairline,
			borderColor: theme.colors.warning,
			paddingHorizontal: theme.spacing.xs,
			overflow: 'hidden',
		},
	});
	return styles;
}
