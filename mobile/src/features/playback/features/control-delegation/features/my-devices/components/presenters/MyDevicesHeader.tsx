import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

export function MyDevicesHeader() {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={styles.headerBlock}>
			<Text style={styles.headerDesc}>
				Choisissez quels amis peuvent contrôler la musique de chaque appareil
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		headerBlock: {
			marginBottom: theme.spacing.lg,
		},
		headerDesc: {
			color: theme.colors.textSecondary,
			fontSize: 14,
			lineHeight: 20,
		},
	});
	return styles;
}
