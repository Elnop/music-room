import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { Plan } from '@/features/subscription/lib/subscription';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';
import { SubscriptionSection } from './SubscriptionSection';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import AngleRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-right-solid.svg';

interface SettingsViewProps {
	theme: Theme;
	bottomPadding: number;
	plan: Plan | undefined;
	isChangingPlan: boolean;
	onTogglePremium: (premium: boolean) => void;
	onOpenPrivacyPolicy: () => void;
	backendUrlField: React.ReactNode;
}

export function SettingsView({
	theme,
	bottomPadding,
	plan,
	isChangingPlan,
	onTogglePremium,
	onOpenPrivacyPolicy,
	backendUrlField,
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

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Serveur</Text>
				{backendUrlField}
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>À propos</Text>
				<Pressable
					onPress={onOpenPrivacyPolicy}
					accessibilityLabel="Politique de confidentialité"
					style={styles.row}
				>
					<Text style={styles.rowLabel}>Politique de confidentialité</Text>
					<PixelIcon icon={AngleRightSolid} size={20} color={theme.colors.textSecondary} />
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
			...pixelFrame(theme),
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.md,
			margin: theme.spacing.md,
			marginBottom: 0,
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
