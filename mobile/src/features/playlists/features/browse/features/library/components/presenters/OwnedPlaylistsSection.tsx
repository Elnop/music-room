import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { SectionHeader } from '@/shared/theme/components/SectionHeader';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import type { LibraryScreen } from '@/features/playlists/features/browse/features/library/libraryTypes';
import { createListStyles } from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';
import { PlaylistGrid } from '@/features/playlists/features/browse/shared/playlist-grid/components/PlaylistGrid';
import CassetteTapeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/cassette-tape-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type OwnedPlaylistsSectionProps = {
	screen: LibraryScreen;
	onPlaylistActions?: (playlist: Playlist) => (() => void) | undefined;
};

export function OwnedPlaylistsSection({ screen, onPlaylistActions }: OwnedPlaylistsSectionProps) {
	const { styles } = useThemedStyles(createListStyles);

	return (
		<View style={styles.section}>
			<SectionHeader icon={CassetteTapeSolid} title="Vos playlists" count={screen.owned.length} />
			{screen.owned.length > 0 ? (
				<PlaylistGrid
					playlists={screen.owned}
					onOpen={screen.openPlaylist}
					onPlaylistActions={onPlaylistActions}
				/>
			) : (
				<EmptyState
					icon={MusicSolid}
					message="Aucune playlist pour l'instant. Créez votre première playlist !"
					action={{ label: 'Créer une playlist', onPress: screen.createPlaylist }}
				/>
			)}
		</View>
	);
}
