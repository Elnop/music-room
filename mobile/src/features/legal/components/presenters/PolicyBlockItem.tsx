import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { PolicyBlock } from '@/features/legal/policyTypes';
import { policyKey } from '@/features/legal/policyKey';
import { PolicyText } from '@/features/legal/components/presenters/PolicyText';

type PolicyBlockItemProps = {
	block: PolicyBlock;
	onOpenLink: (url: string) => void;
};

export function PolicyBlockItem({ block, onOpenLink }: PolicyBlockItemProps) {
	const { styles } = useThemedStyles(createStyles);

	if ('paragraph' in block) return <PolicyText spans={block.paragraph} onOpenLink={onOpenLink} />;
	return (
		<View style={styles.list}>
			{block.list.map((item) => (
				<View key={policyKey(item)} style={styles.item}>
					<Text style={styles.bullet}>•</Text>
					<PolicyText spans={item} style={styles.itemText} onOpenLink={onOpenLink} />
				</View>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		list: {
			gap: theme.spacing.sm,
		},
		item: {
			flexDirection: 'row',
			gap: theme.spacing.sm,
		},
		bullet: {
			fontSize: theme.typography.sizes.md,
			lineHeight: theme.typography.lineHeights.md,
			color: theme.colors.textSecondary,
		},
		itemText: {
			flex: 1,
		},
	});
	return styles;
}
