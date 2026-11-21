import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type FriendsTabButtonProps = {
	label: string;
	active: boolean;
	onPress: () => void;
};

export function FriendsTabButton({ label, active, onPress }: FriendsTabButtonProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={[styles.tab, active && styles.tabActive]}
			onPress={onPress}
			accessibilityLabel={label}
		>
			<Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		tab: {
			flex: 1,
			paddingVertical: theme.spacing.sm,
			alignItems: 'center',
		},
		tabActive: {
			backgroundColor: theme.colors.primary,
		},
		tabText: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.textSecondary,
		},
		tabTextActive: {
			color: theme.colors.surface,
			fontFamily: theme.typography.families.semibold,
		},
	});
	return styles;
}
