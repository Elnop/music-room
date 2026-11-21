import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ActionSheetTitleProps = {
	title?: string;
	subtitle?: string;
};

export function ActionSheetTitle({ title, subtitle }: ActionSheetTitleProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.headerText}>
			<Text style={styles.title} numberOfLines={1}>
				{title}
			</Text>
			{subtitle !== undefined && (
				<Text style={styles.subtitle} numberOfLines={1}>
					{subtitle}
				</Text>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		headerText: {
			flex: 1,
		},
		title: {
			fontSize: theme.typography.sizes.lxl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		subtitle: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}
