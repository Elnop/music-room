import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';

type ActionSheetRowLabelProps = {
	label: string;
	detail?: string;
	destructive: boolean;
};

export function ActionSheetRowLabel({ label, detail, destructive }: ActionSheetRowLabelProps) {
	const { styles } = useThemedStyles(createStyles);
	const tone = destructive ? styles.destructive : styles.plain;

	if (detail === undefined) return <Text style={[styles.label, tone]}>{label}</Text>;
	return (
		<View style={styles.textBlock}>
			<Text style={[styles.blockLabel, tone]} numberOfLines={1}>
				{label}
			</Text>
			<Text style={styles.detail}>{detail}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		textBlock: {
			flex: 1,
		},
		label: {
			flex: 1,
			fontSize: theme.typography.sizes.lg,
		},
		blockLabel: {
			fontSize: theme.typography.sizes.lg,
		},
		detail: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
		plain: { color: theme.colors.text },
		destructive: { color: theme.colors.error },
	});
	return styles;
}
