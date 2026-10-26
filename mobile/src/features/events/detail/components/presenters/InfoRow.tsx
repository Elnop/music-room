import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface InfoRowProps {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	text: string;
}

export function InfoRow({ icon, label, text }: InfoRowProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.row} accessible accessibilityLabel={`${label} : ${text}`}>
			<Ionicons name={icon} size={20} color={theme.colors.primary} style={styles.icon} />
			<View style={styles.body}>
				<Text style={styles.label}>{label}</Text>
				<Text style={styles.text}>{text}</Text>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
		icon: { marginTop: 2 },
		body: { flex: 1 },
		label: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		text: { fontSize: theme.typography.sizes.lg, color: theme.colors.text, marginTop: 2 },
	});
