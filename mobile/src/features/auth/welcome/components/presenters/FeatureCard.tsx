import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/components/ui/Text';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';
import type { LandingFeature } from '@/features/auth/welcome/utils/landingContent';

export function FeatureCard({ title, description, icon }: LandingFeature) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.card}>
			<Ionicons name={icon} size={24} color={theme.colors.primary} />
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.description}>{description}</Text>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		card: {
			flex: 1,
			gap: theme.spacing.sm,
			padding: theme.spacing.lg,
			backgroundColor: theme.colors.surface,
			borderRadius: 16,
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
