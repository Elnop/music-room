import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createSharingStyles } from './sharingStyles';
import { Text } from '@/shared/components/ui/Text';

/** A public playlist open to all: nothing to manage. */
export function OpenPlaylistInfo() {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={[shared.card, styles.card]}>
			<Ionicons name="information-circle" size={28} color={theme.colors.primary} />
			<View style={styles.content}>
				<Text style={styles.title}>Playlist ouverte</Text>
				<Text style={styles.text}>
					Cette playlist est publique : tout le monde peut ajouter ou retirer des titres.
				</Text>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		card: {
			flexDirection: 'row',
			padding: theme.spacing.lg,
			marginBottom: theme.spacing.lg,
			gap: theme.spacing.md,
		},
		content: { flex: 1 },
		title: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		text: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			lineHeight: 20,
		},
	});
