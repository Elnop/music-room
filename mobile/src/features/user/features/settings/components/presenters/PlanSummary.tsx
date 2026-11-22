import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Plan } from '@/features/subscription/subscriptionTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';

type PlanSummaryProps = {
	plan: Plan | undefined;
};

export function PlanSummary({ plan }: PlanSummaryProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.label}>
			<Text style={styles.title}>Premium</Text>
			<Text style={styles.plan}>Offre actuelle : {planName(plan)}</Text>
		</View>
	);
}

function planName(plan: Plan | undefined): string {
	if (plan === undefined) return '…';
	return plan === 'premium' ? 'Premium' : 'Gratuite';
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		label: {
			flex: 1,
		},
		title: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		plan: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xs,
		},
	});
	return styles;
}
