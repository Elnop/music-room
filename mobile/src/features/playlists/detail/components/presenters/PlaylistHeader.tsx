import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/shared/components/media/Avatar';
import { ShareLinkButton } from '@/shared/components/sharing/ShareLinkButton';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { playlistLink } from '@/shared/utils/shareLinks';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import { headerFacts } from '@/features/playlists/detail/utils/headerFacts';
import { AddTrackRow } from './AddTrackRow';
import { PlaylistCover } from './PlaylistCover';
import { Text } from '@/shared/components/ui/Text';

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
	const { trackCount, trackLabel, ownerName, collaboratorLabel } = headerFacts(playlist);

	return (
		<View style={styles.container}>
			<PlaylistCover playlist={playlist} style={styles.cover} />
			<Text style={styles.name}>{playlist.name}</Text>
			{!!playlist.description && <Text style={styles.description}>{playlist.description}</Text>}
			<View style={styles.meta}>
				<Avatar uri={playlist.owner.avatarUrl} name={ownerName} size="sm" />
				<Text style={styles.owner} numberOfLines={1}>
					{ownerName}
				</Text>
				<Text style={styles.separator}>•</Text>
				<Text style={styles.trackCount}>{trackLabel}</Text>
				{trackCount > 0 && <View style={styles.play}>{playButton}</View>}
			</View>
			{collaboratorLabel && (
				<View style={styles.collaborators}>
					<Ionicons name="people-outline" size={14} color={theme.colors.primary} />
					<Text style={styles.collaboratorsText}>{collaboratorLabel}</Text>
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
		cover: { marginBottom: theme.spacing.lg },
		name: {
			fontSize: theme.typography.sizes.xxl,
			fontFamily: theme.typography.families.bold,
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
			fontFamily: theme.typography.families.regular,
		},
		meta: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm },
		owner: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.text,
			fontFamily: theme.typography.families.medium,
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
			fontFamily: theme.typography.families.semibold,
		},
		share: { marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
	});
