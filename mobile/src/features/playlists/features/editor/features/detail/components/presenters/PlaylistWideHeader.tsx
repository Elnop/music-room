import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import { AddTrackRow } from '@/features/playlists/features/editor/features/detail/components/presenters/AddTrackRow';
import { PlaylistCover } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistCover';
import { PlaylistWideDetails } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistWideDetails';

type PlaylistWideHeaderProps = {
	playlist: PlaylistWithTracks;
	playButton: React.ReactNode;
	canEdit: boolean;
	onAddTrack: () => void;
};

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
				<PlaylistWideDetails playlist={playlist} playButton={playButton} />
			</View>
			{canEdit && <AddTrackRow onPress={onAddTrack} />}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: { paddingBottom: theme.spacing.sm },
		hero: {
			flexDirection: 'row',
			alignItems: 'flex-end',
			gap: theme.spacing.xl,
			marginBottom: theme.spacing.lg,
			paddingHorizontal: theme.spacing.lg,
		},
	});
	return styles;
}
