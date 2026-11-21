import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ShareLinkButton } from '@/shared/theme/components/ShareLinkButton';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { playlistLink } from '@/shared/share-links/shareLinks';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import { PlaylistByline } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistByline';
import { Text } from '@/shared/theme/components/Text';

type PlaylistWideDetailsProps = {
	playlist: PlaylistWithTracks;
	playButton: React.ReactNode;
};

export function PlaylistWideDetails({ playlist, playButton }: PlaylistWideDetailsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.details}>
			<Text style={styles.kind}>
				{playlist.visibility === 'private' ? 'Playlist privée' : 'Playlist publique'}
			</Text>
			<Text style={styles.name} numberOfLines={2}>
				{playlist.name}
			</Text>
			{Boolean(playlist.description) && (
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
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		details: { flex: 1, minWidth: 0 },
		kind: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		name: { ...displayText(theme, 40), color: theme.colors.text, marginTop: theme.spacing.xs },
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
	return styles;
}
