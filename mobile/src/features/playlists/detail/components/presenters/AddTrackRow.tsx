import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/components/ui/Text';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/** « Ajouter un titre », the first row under the header of a playlist an editor sees. */
export function AddTrackRow({ onPress }: { onPress: () => void }) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable style={styles.row} onPress={onPress} accessibilityLabel="Ajouter un titre">
			<View style={styles.icon}>
				<Ionicons name="add" size={24} color={theme.colors.textSecondary} />
			</View>
			<Text style={styles.text}>Ajouter un titre</Text>
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			alignSelf: 'stretch',
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
			marginHorizontal: -theme.spacing.lg,
		},
		icon: {
			width: 48,
			height: 48,
			backgroundColor: theme.colors.surfaceAlt,
			justifyContent: 'center',
			alignItems: 'center',
		},
		text: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.textSecondary,
			marginLeft: theme.spacing.md,
		},
	});
