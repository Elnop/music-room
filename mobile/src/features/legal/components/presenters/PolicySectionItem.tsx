import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { PolicySection } from '@/features/legal/policyTypes';
import { policyKey } from '@/features/legal/policyKey';
import { PolicyBlockItem } from '@/features/legal/components/presenters/PolicyBlockItem';

type PolicySectionItemProps = {
	section: PolicySection;
	onOpenLink: (url: string) => void;
};

export function PolicySectionItem({ section, onOpenLink }: PolicySectionItemProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.section}>
			<Text style={styles.title} accessibilityRole="header">
				{section.title}
			</Text>
			{section.blocks.map((block) => (
				<PolicyBlockItem key={policyKey(block)} block={block} onOpenLink={onOpenLink} />
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		section: {
			gap: theme.spacing.sm,
			marginTop: theme.spacing.sm,
		},
		title: {
			fontSize: theme.typography.sizes.xl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
	});
	return styles;
}
