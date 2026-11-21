import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type UserNameLinesProps = {
	username: string;
	displayName?: string;
	singleLine?: boolean;
};

export function UserNameLines({ username, displayName, singleLine = false }: UserNameLinesProps) {
	const { styles } = useThemedStyles(createStyles);
	const numberOfLines = singleLine ? 1 : undefined;

	return (
		<>
			<Text style={styles.username} numberOfLines={numberOfLines}>
				{username}
			</Text>
			{displayName && (
				<Text style={styles.displayName} numberOfLines={numberOfLines}>
					{displayName}
				</Text>
			)}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		username: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		displayName: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}
