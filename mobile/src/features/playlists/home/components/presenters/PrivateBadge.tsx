import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

interface PrivateBadgeProps {
	/** Writes « Privée » after the lock. */
	labelled?: boolean;
	style?: StyleProp<ViewStyle>;
}

export function PrivateBadge({ labelled = false, style }: PrivateBadgeProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	return (
		<View style={[styles.badge, style]}>
			<Ionicons name="lock-closed" size={10} color={theme.colors.textSecondary} />
			{labelled && <Text style={styles.label}>Privée</Text>}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		badge: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surfaceAlt,
			paddingHorizontal: 6,
			borderRadius: 8,
		},
		label: {
			fontSize: 10,
			color: theme.colors.textSecondary,
			marginLeft: 3,
			fontWeight: theme.typography.weights.medium,
		},
	});
