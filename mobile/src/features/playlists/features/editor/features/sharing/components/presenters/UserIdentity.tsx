import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type UserIdentityProps = {
	username: string;
	displayName?: string | null;
};

export function UserIdentity({ username, displayName }: UserIdentityProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.userInfo}>
			<Text style={styles.displayName} numberOfLines={1}>
				{displayName || username}
			</Text>
			<Text style={styles.username} numberOfLines={1}>
				@{username}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		userInfo: {
			flex: 1,
			marginRight: theme.spacing.sm,
		},
		displayName: {
			fontSize: theme.typography.sizes.mlg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xxs,
		},
		username: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
