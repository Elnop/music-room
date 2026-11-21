import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ToastTextsProps = {
	text1?: string;
	text2?: string;
	theme: Theme;
};

export function ToastTexts({ text1, text2, theme }: ToastTextsProps) {
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={styles.texts}>
			{text1 ? <Text style={styles.text1}>{text1}</Text> : null}
			{text2 ? <Text style={styles.text2}>{text2}</Text> : null}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		texts: {
			flex: 1,
		},
		text1: {
			color: theme.colors.text,
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
		},
		text2: {
			color: theme.colors.textSecondary,
			fontSize: theme.typography.sizes.sm,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}
