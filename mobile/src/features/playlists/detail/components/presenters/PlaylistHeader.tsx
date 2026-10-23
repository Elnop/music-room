import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Artwork } from '@/shared/components/media/Artwork';
import { Avatar } from '@/shared/components/media/Avatar';
import { ShareLinkButton } from '@/shared/components/sharing/ShareLinkButton';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { playlistLink } from '@/shared/utils/shareLinks';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import { AddTrackRow } from './AddTrackRow';

const COVER_SIZE = 200;

interface PlaylistHeaderProps {
	playlist: PlaylistWithTracks;
	/** The Play/Pause button, shown next to the track count of a non-empty playlist. */
	playButton: React.ReactNode;
	/** An editor gets « Ajouter un titre ». */
	canEdit: boolean;
	onAddTrack: () => void;
}

export function PlaylistHeader({ playlist, playButton, canEdit, onAddTrack }: PlaylistHeaderProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const trackCount = playlist.tracks.length;
	const ownerName = playlist.owner.displayName || playlist.owner.username;
	const collaborators = playlist.collaboratorIds.length;

	return (
		<View style={styles.container}>
			<View style={styles.cover}>
				<Artwork
					uri={playlist.coverUrl || playlist.tracks[0]?.albumArt}
					size={COVER_SIZE}
					iconSize={64}
					style={styles.artwork}
				/>
			</View>
			<Text style={styles.name}>{playlist.name}</Text>
			{!!playlist.description && <Text style={styles.description}>{playlist.description}</Text>}
			<View style={styles.meta}>
				<Avatar uri={playlist.owner.avatarUrl} name={ownerName} size="sm" />
				<Text style={styles.owner} numberOfLines={1}>
					{ownerName}
				</Text>
				<Text style={styles.separator}>•</Text>
				<Text style={styles.trackCount}>
					{trackCount} {trackCount === 1 ? 'titre' : 'titres'}
				</Text>
				{trackCount > 0 && <View style={styles.play}>{playButton}</View>}
			</View>
			{collaborators > 0 && (
				<View style={styles.collaborators}>
					<Ionicons name="people-outline" size={14} color={theme.colors.primary} />
					<Text style={styles.collaboratorsText}>
						{collaborators} {collaborators === 1 ? 'collaborateur' : 'collaborateurs'}
					</Text>
				</View>
			)}

			<ShareLinkButton url={playlistLink(playlist.id)} title={playlist.name} style={styles.share} />

			{canEdit && <AddTrackRow onPress={onAddTrack} />}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: { alignItems: 'center', padding: theme.spacing.lg, paddingBottom: 0 },
		cover: {
			borderRadius: 8,
			backgroundColor: theme.colors.surfaceAlt,
			marginBottom: theme.spacing.lg,
			shadowColor: theme.colors.shadow,
			shadowOffset: { width: 0, height: 8 },
			shadowOpacity: 0.3,
			shadowRadius: 12,
			elevation: 8,
		},
		artwork: { borderRadius: 8 },
		name: {
			fontSize: theme.typography.sizes.xxl,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			textAlign: 'center',
			marginBottom: theme.spacing.sm,
		},
		description: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			textAlign: 'center',
			marginBottom: theme.spacing.md,
			paddingHorizontal: theme.spacing.md,
			fontWeight: theme.typography.weights.regular,
		},
		meta: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm },
		owner: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.text,
			fontWeight: theme.typography.weights.medium,
			marginLeft: theme.spacing.sm,
			flexShrink: 1,
		},
		separator: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginHorizontal: theme.spacing.sm,
		},
		trackCount: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		play: { marginLeft: theme.spacing.md },
		collaborators: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: theme.spacing.sm,
			gap: theme.spacing.xs,
		},
		collaboratorsText: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.primary,
			fontWeight: theme.typography.weights.semibold,
		},
		share: { marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
	});
