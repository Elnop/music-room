import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CONTENT_MAX_WIDTH } from '@/shared/theme/configs/layoutConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { FeaturesSection } from '@/features/user/features/auth/features/welcome/components/presenters/FeaturesSection';
import { DownloadSection } from '@/features/user/features/auth/features/welcome/components/presenters/DownloadSection';
import { LandingFooter } from '@/features/user/features/auth/features/welcome/components/presenters/LandingFooter';
import type { WelcomeActions } from '@/features/user/features/auth/features/welcome/welcomeTypes';

type LandingSectionsProps = {
	buildLabel: string;
	actions: WelcomeActions;
};

export function LandingSections({ buildLabel, actions }: LandingSectionsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.sections}>
			<FeaturesSection />
			<DownloadSection onOpenLink={actions.onOpenLink} />
			<LandingFooter buildLabel={buildLabel} actions={actions} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		sections: {
			width: '100%',
			maxWidth: CONTENT_MAX_WIDTH.content,
			alignSelf: 'center',
			gap: theme.spacing.xl,
			paddingTop: theme.spacing.xl,
		},
	});
	return styles;
}
