import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackendUrlField } from '@/shared/components/form/BackendUrlField';
import { BACKEND_URL_EDITABLE } from '@/shared/constants/platform';
import type { Plan } from '@/shared/types/subscription';
import type { Theme } from '@/shared/theme/types';
import { SubscriptionSection } from './SubscriptionSection';

interface SettingsViewProps {
	theme: Theme;
	bottomPadding: number;
	plan: Plan | undefined;
	isChangingPlan: boolean;
	onTogglePremium: (premium: boolean) => void;
}

export function SettingsView({
	theme,
	bottomPadding,
	plan,
	isChangingPlan,
	onTogglePremium,
}: SettingsViewProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<ScrollView
			style={styles.container}
			keyboardShouldPersistTaps="handled"
			contentContainerStyle={{ paddingBottom: bottomPadding }}
		>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Abonnement</Text>
				<SubscriptionSection
					theme={theme}
					plan={plan}
					disabled={plan === undefined || isChangingPlan}
					onTogglePremium={onTogglePremium}
				/>
			</View>

			{BACKEND_URL_EDITABLE && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Serveur</Text>
					<BackendUrlField />
				</View>
			)}
		</ScrollView>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		section: {
			padding: theme.spacing.md,
			borderBottomWidth: theme.borders.thin,
			borderBottomColor: theme.colors.borderLight,
		},
		sectionTitle: {
			fontSize: theme.typography.sizes.xl,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.md,
		},
	});
