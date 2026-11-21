import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type LandingTitleProps = {
	title: string;
};

export function LandingTitle({ title }: LandingTitleProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Text style={styles.title} accessibilityRole="header">
			{title}
		</Text>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		title: {
			fontSize: theme.typography.sizes.xl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
	});
	return styles;
}
