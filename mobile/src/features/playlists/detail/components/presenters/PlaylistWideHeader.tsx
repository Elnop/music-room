import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ShareLinkButton } from '@/shared/components/sharing/ShareLinkButton';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { playlistLink } from '@/shared/utils/shareLinks';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import { AddTrackRow } from './AddTrackRow';
import { PlaylistByline } from './PlaylistByline';
import { PlaylistCover } from './PlaylistCover';
import { Text } from '@/shared/components/ui/Text';

interface PlaylistWideHeaderProps {
	playlist: PlaylistWithTracks;
	playButton: React.ReactNode;
	canEdit: boolean;
	onAddTrack: () => void;
}

/** The playlist's header on wide screens: the cover beside its title, details and actions. */
export function PlaylistWideHeader({
	playlist,
	playButton,
	canEdit,
	onAddTrack,
}: PlaylistWideHeaderProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<View style={styles.hero}>
				<PlaylistCover playlist={playlist} />
				<View style={styles.details}>
					<Text style={styles.kind}>
						{playlist.visibility === 'private' ? 'Playlist privée' : 'Playlist publique'}
					</Text>
					<Text style={styles.name} numberOfLines={2}>
						{playlist.name}
					</Text>
					{!!playlist.description && (
						<Text style={styles.description} numberOfLines={3}>
							{playlist.description}
						</Text>
					)}
					<PlaylistByline playlist={playlist} />
					<View style={styles.actions}>
						{playlist.tracks.length > 0 && playButton}
						<ShareLinkButton url={playlistLink(playlist.id)} title={playlist.name} />
					</View>
				</View>
			</View>
			{canEdit && <AddTrackRow onPress={onAddTrack} />}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm },
		hero: {
			flexDirection: 'row',
			alignItems: 'flex-end',
			gap: theme.spacing.xl,
			marginBottom: theme.spacing.lg,
		},
		details: { flex: 1, minWidth: 0 },
		kind: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		name: {
			fontSize: 40,
			fontFamily: theme.typography.families.extrabold,
			color: theme.colors.text,
			marginTop: theme.spacing.xs,
		},
		description: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.sm,
		},
		actions: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
			marginTop: theme.spacing.lg,
		},
	});
