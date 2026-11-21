import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PANEL_GUTTER } from '@/features/playback/features/now-playing-panel/nowPlayingPanelConfig';

type PanelCardLink = {
	label: string;
	accessibilityLabel: string;
	onPress: () => void;
};

type PanelCardProps = {
	title: string;
	link: PanelCardLink;
	children: React.ReactNode;
};

export function PanelCard({ title, link, children }: PanelCardProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.cardTitle} accessibilityRole="header">
					{title}
				</Text>
				<Pressable onPress={link.onPress} accessibilityLabel={link.accessibilityLabel}>
					<Text style={styles.link}>{link.label}</Text>
				</Pressable>
			</View>
			{children}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		card: { padding: PANEL_GUTTER, gap: theme.spacing.md, backgroundColor: theme.colors.surface },
		cardHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.sm,
		},
		cardTitle: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		link: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
