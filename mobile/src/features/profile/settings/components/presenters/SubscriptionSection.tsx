import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedSwitch } from '@/shared/components/ui/ThemedSwitch';
import type { Plan } from '@/shared/types/subscription';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';

interface SubscriptionSectionProps {
	theme: Theme;
	plan: Plan | undefined;
	disabled: boolean;
	onTogglePremium: (premium: boolean) => void;
}

export function SubscriptionSection({
	theme,
	plan,
	disabled,
	onTogglePremium,
}: SubscriptionSectionProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const isPremium = plan === 'premium';

	return (
		<View>
			<View style={styles.row}>
				<View style={styles.label}>
					<Text style={styles.title}>Premium</Text>
					<Text style={styles.plan}>
						Offre actuelle : {plan === undefined ? '…' : isPremium ? 'Premium' : 'Gratuite'}
					</Text>
				</View>
				<ThemedSwitch
					value={isPremium}
					onValueChange={onTogglePremium}
					disabled={disabled}
					accessibilityLabel="Premium"
				/>
			</View>
			<Text style={styles.note}>Simulation : aucun paiement n'est demandé.</Text>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.md,
		},
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
		note: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.sm,
		},
	});
