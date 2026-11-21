import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type PasswordScreenHeaderProps = {
	title: string;
	subtitle: string;
	emphasis?: string;
	compact: boolean;
};

export function PasswordScreenHeader({
	title,
	subtitle,
	emphasis,
	compact,
}: PasswordScreenHeaderProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={compact ? styles.compactHeader : styles.header}>
			<Text style={styles.title}>{title}</Text>
			<Text style={styles.subtitle}>
				{subtitle}
				{emphasis ? <Text style={styles.emphasis}>{`\n${emphasis}`}</Text> : null}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			marginBottom: theme.spacing.xlg,
		},
		compactHeader: {
			marginBottom: theme.spacing.xl,
		},
		title: {
			fontSize: theme.typography.sizes.xxxl,
			fontFamily: theme.typography.families.bold,
			marginBottom: theme.spacing.smd,
			color: theme.colors.text,
		},
		subtitle: {
			fontSize: theme.typography.sizes.lg,
			lineHeight: theme.typography.lineHeights.lg,
			color: theme.colors.textSecondary,
		},
		emphasis: {
			fontFamily: theme.typography.families.semibold,
		},
	});
	return styles;
}
