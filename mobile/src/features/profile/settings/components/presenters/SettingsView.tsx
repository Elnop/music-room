import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useContentColumn } from '@/shared/hooks/useContentColumn';
import { Ionicons } from '@expo/vector-icons';
import { BackendUrlField } from '@/shared/components/form/BackendUrlField';
import { BACKEND_URL_EDITABLE } from '@/shared/constants/platform';
import type { Plan } from '@/shared/types/subscription';
import type { Theme } from '@/shared/theme/types';
import { SubscriptionSection } from './SubscriptionSection';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';

interface SettingsViewProps {
	theme: Theme;
	bottomPadding: number;
	plan: Plan | undefined;
	isChangingPlan: boolean;
	onTogglePremium: (premium: boolean) => void;
	onOpenPrivacyPolicy: () => void;
}

export function SettingsView({
	theme,
	bottomPadding,
	plan,
	isChangingPlan,
	onTogglePremium,
	onOpenPrivacyPolicy,
}: SettingsViewProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const column = useContentColumn();

	return (
		<ScrollView
			style={styles.container}
			keyboardShouldPersistTaps="handled"
			contentContainerStyle={[{ paddingBottom: bottomPadding }, column]}
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

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>À propos</Text>
				<Pressable
					onPress={onOpenPrivacyPolicy}
					accessibilityLabel="Politique de confidentialité"
					style={styles.row}
				>
					<Text style={styles.rowLabel}>Politique de confidentialité</Text>
					<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
				</Pressable>
			</View>
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
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.md,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.md,
		},
		rowLabel: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
