import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import {
	POLICY_INTRO,
	POLICY_SECTIONS,
	POLICY_UPDATED_AT,
} from '@/features/legal/privacyPolicyContent';
import { PolicyText } from '@/features/legal/components/presenters/PolicyText';
import { PolicySectionItem } from '@/features/legal/components/presenters/PolicySectionItem';

type PrivacyPolicyViewProps = {
	bottomPadding: number;
	onOpenLink: (url: string) => void;
};

export function PrivacyPolicyView({ bottomPadding, onOpenLink }: PrivacyPolicyViewProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={[styles.content, paddingBottomStyle(bottomPadding)]}
		>
			<Text style={styles.updatedAt}>{POLICY_UPDATED_AT}</Text>
			<PolicyText spans={POLICY_INTRO} onOpenLink={onOpenLink} />
			{POLICY_SECTIONS.map(section => (
				<PolicySectionItem key={section.title} section={section} onOpenLink={onOpenLink} />
			))}
		</ScrollView>
	);
}

function paddingBottomStyle(paddingBottom: number): ViewStyle {
	return { paddingBottom };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		content: {
			padding: theme.spacing.md,
			gap: theme.spacing.md,
		},
		updatedAt: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
