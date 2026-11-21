import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';

type WideProfileHandleProps = {
	username: string;
	badges?: React.ReactNode;
};

export function WideProfileHandle({ username, badges }: WideProfileHandleProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.usernameRow}>
			<Text style={styles.username}>@{username}</Text>
			{badges}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		usernameRow: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			alignItems: 'center',
			gap: theme.spacing.sm,
		},
		username: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
