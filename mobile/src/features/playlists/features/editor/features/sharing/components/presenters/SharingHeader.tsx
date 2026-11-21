import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { sharingHeader } from '@/features/playlists/features/editor/features/sharing/lib/sharingTexts';
import type { SharingMode } from '@/features/playlists/features/editor/features/sharing/sharingTypes';

type SharingHeaderProps = {
	mode: SharingMode;
};

export function SharingHeader({ mode }: SharingHeaderProps) {
	const { styles } = useThemedStyles(createStyles);
	const header = sharingHeader(mode);

	return (
		<View style={styles.header}>
			<Text style={styles.title}>{header.title}</Text>
			<Text style={styles.subtitle}>{header.subtitle}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			padding: theme.spacing.lg,
			borderBottomWidth: theme.borders.medium,
			borderBottomColor: theme.colors.border,
			backgroundColor: theme.colors.surface,
		},
		title: {
			fontSize: theme.typography.sizes.xl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		subtitle: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
	});
	return styles;
}
