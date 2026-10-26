import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatEventDate } from '@/features/events/utils/eventDates';

interface DateTimeRowProps {
	label: string;
	value: Date;
	onPress: () => void;
}

export function DateTimeRow({ label, value, onPress }: DateTimeRowProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const text = formatEventDate(value);

	return (
		<Pressable style={styles.row} onPress={onPress} accessibilityLabel={`${label} : ${text}`}>
			<View>
				<Text style={styles.label}>{label}</Text>
				<Text style={styles.value}>{text}</Text>
			</View>
			<Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			padding: theme.spacing.md,
			borderRadius: 12,
			backgroundColor: theme.colors.surface,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		label: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		value: {
			fontSize: theme.typography.sizes.lg,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginTop: 2,
		},
	});
