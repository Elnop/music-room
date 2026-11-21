import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type NameWithHandleProps = {
	name: string;
	username: string;
	size: 'medium' | 'large';
};

export function NameWithHandle({ name, username, size }: NameWithHandleProps) {
	const { styles } = useThemedStyles(createStyles);
	const large = size === 'large';

	return (
		<>
			<Text style={[styles.name, large && styles.largeName]} numberOfLines={1}>
				{name}
			</Text>
			<Text style={[styles.handle, large && styles.largeHandle]} numberOfLines={1}>
				@{username}
			</Text>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		name: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		largeName: {
			fontSize: theme.typography.sizes.mlg,
			marginBottom: theme.spacing.xxs,
		},
		handle: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		largeHandle: {
			fontSize: theme.typography.sizes.smd,
		},
	});
	return styles;
}
