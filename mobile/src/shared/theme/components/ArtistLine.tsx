import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ArtistLineProps = {
	artist: string;
	size: 'regular' | 'small';
};

export function ArtistLine({ artist, size }: ArtistLineProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Text style={size === 'small' ? styles.small : styles.regular} numberOfLines={1}>
			{artist}
		</Text>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		regular: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.textSecondary,
		},
		small: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.hairline,
		},
	});
	return styles;
}
