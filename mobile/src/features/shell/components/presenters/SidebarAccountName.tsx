import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

type SidebarAccountNameProps = {
	name: string;
	username: string;
};

export function SidebarAccountName({ name, username }: SidebarAccountNameProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.info}>
			<Text style={styles.name} numberOfLines={1}>
				{name}
			</Text>
			<Text style={styles.username} numberOfLines={1}>
				@{username}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		info: {
			flex: 1,
			minWidth: 0,
		},
		name: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		username: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
