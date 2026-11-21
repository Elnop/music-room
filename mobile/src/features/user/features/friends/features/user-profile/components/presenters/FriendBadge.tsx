import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

export function FriendBadge() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.friendBadge}>
			<Text style={styles.friendBadgeText}>Amis</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		friendBadge: {
			flex: 1,
			backgroundColor: theme.colors.primary,
			paddingVertical: theme.spacing.sm,
			alignItems: 'center',
			justifyContent: 'center',
		},
		friendBadgeText: {
			color: theme.colors.surface,
			fontFamily: theme.typography.families.semibold,
			fontSize: theme.typography.sizes.md,
		},
	});
	return styles;
}
