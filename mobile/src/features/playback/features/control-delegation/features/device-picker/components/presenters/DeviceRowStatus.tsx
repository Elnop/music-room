import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type DeviceRowStatusProps = {
	pending: boolean;
	active: boolean;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		activeBadge: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.primary,
		},
	});
	return styles;
}

export function DeviceRowStatus({ pending, active }: DeviceRowStatusProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	if (pending) return <ActivityIndicator size="small" color={theme.colors.primary} />;
	return active ? <Text style={styles.activeBadge}>En cours</Text> : null;
}
