import React from 'react';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { PlaylistCardSkeleton, SkeletonList } from '@/shared/theme/components/Skeleton';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import type { HomeScreen } from '@/features/playlists/features/browse/features/home/homeTypes';
import { createGridStyles } from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';
import { PlaylistGrid } from '@/features/playlists/features/browse/shared/playlist-grid/components/PlaylistGrid';
import GlobeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/globe-solid.svg';

type PublicPlaylistsBodyProps = {
	screen: HomeScreen;
	onPlaylistActions?: (playlist: Playlist) => (() => void) | undefined;
};

export function PublicPlaylistsBody({ screen, onPlaylistActions }: PublicPlaylistsBodyProps) {
	const { styles } = useThemedStyles(createGridStyles);
	const { isWide } = useBreakpoint();

	if (screen.publicLoading && screen.publicPlaylists.length === 0) {
		return <SkeletonList count={4} row={PlaylistCardSkeleton} style={styles.grid} />;
	}
	if (screen.publicPlaylists.length > 0) {
		return (
			<PlaylistGrid
				playlists={screen.publicPlaylists}
				onOpen={screen.openPlaylist}
				onPlaylistActions={onPlaylistActions}
			/>
		);
	}
	return (
		<EmptyState icon={GlobeSolid} message="Aucune playlist publique disponible" compact={isWide} />
	);
}
