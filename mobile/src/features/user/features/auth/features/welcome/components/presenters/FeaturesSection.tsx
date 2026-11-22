import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { LANDING_FEATURES } from '@/features/user/features/auth/features/welcome/landingContent';
import { FeatureCard } from '@/features/user/features/auth/features/welcome/components/presenters/FeatureCard';
import { LandingTitle } from '@/features/user/features/auth/features/welcome/components/presenters/LandingTitle';

function columnCount(isWide: boolean, isDesktop: boolean): number {
	if (isDesktop) return 4;
	return isWide ? 2 : 1;
}

export function FeaturesSection() {
	const { styles } = useThemedStyles(createStyles);
	const { isWide, isDesktop } = useBreakpoint();
	const columns = columnCount(isWide, isDesktop);
	const rows = Array.from({ length: Math.ceil(LANDING_FEATURES.length / columns) }, (_, row) =>
		LANDING_FEATURES.slice(row * columns, (row + 1) * columns),
	);

	return (
		<View style={styles.section}>
			<LandingTitle title="Fonctionnalités" />
			{rows.map((features) => (
				<View key={features[0].title} style={styles.row}>
					{features.map((feature) => (
						<FeatureCard key={feature.title} feature={feature} />
					))}
				</View>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		section: {
			gap: theme.spacing.md,
		},
		row: {
			flexDirection: 'row',
			gap: theme.spacing.md,
		},
	});
	return styles;
}
