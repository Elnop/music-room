import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { bottomPaddingStyle } from '@/features/user/shared/profile-layout/bottomPaddingStyle';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import type { Plan } from '@/features/subscription/subscriptionTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { SubscriptionSection } from '@/features/user/features/settings/components/presenters/SubscriptionSection';
import { SettingsSection } from '@/features/user/features/settings/components/presenters/SettingsSection';
import { AboutSection } from '@/features/user/features/settings/components/presenters/AboutSection';

type SettingsViewProps = {
	bottomPadding: number;
	plan: Plan | undefined;
	isChangingPlan: boolean;
	onTogglePremium: (premium: boolean) => void;
	onOpenPrivacyPolicy: () => void;
	backendUrlField: React.ReactNode;
};

export function SettingsView(props: SettingsViewProps) {
	const { styles } = useThemedStyles(createStyles);
	const column = useContentColumn();

	return (
		<ScrollView
			style={styles.container}
			keyboardShouldPersistTaps="handled"
			contentContainerStyle={[bottomPaddingStyle(props.bottomPadding), column]}
		>
			<SettingsSection title="Abonnement">
				<SubscriptionSection
					plan={props.plan}
					disabled={props.plan === undefined || props.isChangingPlan}
					onTogglePremium={props.onTogglePremium}
				/>
			</SettingsSection>
			<SettingsSection title="Serveur">{props.backendUrlField}</SettingsSection>
			<AboutSection onOpenPrivacyPolicy={props.onOpenPrivacyPolicy} />
		</ScrollView>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
	});
	return styles;
}
