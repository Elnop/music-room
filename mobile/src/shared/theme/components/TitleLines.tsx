import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type TitleLinesProps = {
	title?: string;
	subtitle?: string;
	size: 'regular' | 'large';
	singleLine?: boolean;
};

export function TitleLines({ title, subtitle, size, singleLine = false }: TitleLinesProps) {
	const { styles } = useThemedStyles(createStyles);
	const numberOfLines = singleLine ? 1 : undefined;
	const sizeStyle = size === 'large' ? styles.large : styles.regular;

	return (
		<View style={styles.container}>
			<Text style={[styles.title, sizeStyle]} numberOfLines={numberOfLines}>
				{title}
			</Text>
			{subtitle !== undefined && (
				<Text style={styles.subtitle} numberOfLines={numberOfLines}>
					{subtitle}
				</Text>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
		},
		title: {
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		regular: {
			fontSize: theme.typography.sizes.lg,
		},
		large: {
			fontSize: theme.typography.sizes.lxl,
		},
		subtitle: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}
