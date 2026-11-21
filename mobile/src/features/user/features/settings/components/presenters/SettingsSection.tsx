import React from 'react';
import { StyleSheet, View } from 'react-native';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';

type SettingsSectionProps = {
	title: string;
	children: React.ReactNode;
};

export function SettingsSection({ title, children }: SettingsSectionProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			{children}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		section: {
			...pixelFrame(theme),
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.md,
			margin: theme.spacing.md,
			marginBottom: 0,
		},
		sectionTitle: {
			fontSize: theme.typography.sizes.xl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.md,
		},
	});
	return styles;
}
