import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/shared/components/media/Avatar';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { headerFacts } from '@/features/playlists/detail/utils/headerFacts';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import { Text } from '@/shared/components/ui/Text';

/** Who owns the playlist, how many tracks it has and who edits it, on one line (wide screens). */
export function PlaylistByline({ playlist }: { playlist: PlaylistWithTracks }) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { trackLabel, ownerName, collaboratorLabel } = headerFacts(playlist);

	return (
		<View style={styles.meta}>
			<Avatar uri={playlist.owner.avatarUrl} name={ownerName} size="sm" />
			<Text style={styles.owner} numberOfLines={1}>
				{ownerName}
			</Text>
			<Text style={styles.separator}>•</Text>
			<Text style={styles.secondary}>{trackLabel}</Text>
			{collaboratorLabel && (
				<>
					<Text style={styles.separator}>•</Text>
					<Ionicons name="people-outline" size={14} color={theme.colors.primary} />
					<Text style={styles.collaborators}>{collaboratorLabel}</Text>
				</>
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		meta: {
			flexDirection: 'row',
			alignItems: 'center',
			flexWrap: 'wrap',
			gap: theme.spacing.xs,
			marginTop: theme.spacing.md,
		},
		owner: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.text,
			fontFamily: theme.typography.families.semibold,
			marginLeft: theme.spacing.xs,
			flexShrink: 1,
		},
		separator: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginHorizontal: theme.spacing.xs,
		},
		secondary: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		collaborators: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.primary,
			fontFamily: theme.typography.families.semibold,
		},
	});
