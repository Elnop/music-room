import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { LandingFeature } from '@/features/user/features/auth/features/welcome/welcomeTypes';

type FeatureCardProps = {
	feature: LandingFeature;
};

export function FeatureCard({ feature }: FeatureCardProps) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.card}>
			<PixelIcon icon={feature.icon} size={24} color={theme.colors.primary} />
			<Text style={styles.title}>{feature.title}</Text>
			<Text style={styles.description}>{feature.description}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		card: {
			flex: 1,
			gap: theme.spacing.sm,
			padding: theme.spacing.lg,
			backgroundColor: theme.colors.surface,
		},
		title: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		description: {
			fontSize: theme.typography.sizes.md,
			lineHeight: theme.typography.lineHeights.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
