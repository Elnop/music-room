import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/lib/types';
import type { LandingFeature } from '@/features/user/features/auth/features/welcome/landingContent';

export function FeatureCard({ title, description, icon }: LandingFeature) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.card}>
			<PixelIcon icon={icon} size={24} color={theme.colors.primary} />
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.description}>{description}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
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
			lineHeight: 20,
			color: theme.colors.textSecondary,
		},
	});
}
