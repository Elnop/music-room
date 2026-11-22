import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import type { Plan } from '@/features/subscription/subscriptionTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';
import { PlanSummary } from '@/features/user/features/settings/components/presenters/PlanSummary';

type SubscriptionSectionProps = {
	plan: Plan | undefined;
	disabled: boolean;
	onTogglePremium: (premium: boolean) => void;
};

export function SubscriptionSection({ plan, disabled, onTogglePremium }: SubscriptionSectionProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View>
			<View style={styles.row}>
				<PlanSummary plan={plan} />
				<ThemedSwitch
					value={plan === 'premium'}
					onValueChange={onTogglePremium}
					disabled={disabled}
					accessibilityLabel="Premium"
				/>
			</View>
			<Text style={styles.note}>Simulation : aucun paiement n'est demandé.</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.md,
		},
		note: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.sm,
		},
	});
	return styles;
}
