import React from 'react';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import type { LibraryScreen } from '@/features/playlists/features/browse/features/library/libraryTypes';
import { RefreshableScroll } from '@/features/playlists/features/browse/shared/playlist-grid/components/RefreshableScroll';
import { LibrarySkeleton } from '@/features/playlists/features/browse/features/library/components/presenters/LibrarySkeleton';
import { OwnedPlaylistsSection } from '@/features/playlists/features/browse/features/library/components/presenters/OwnedPlaylistsSection';
import { SharedPlaylistsSection } from '@/features/playlists/features/browse/features/library/components/presenters/SharedPlaylistsSection';

type LibraryViewProps = {
	screen: LibraryScreen;
	onPlaylistActions?: (playlist: Playlist) => (() => void) | undefined;
};

export function LibraryView({ screen, onPlaylistActions }: LibraryViewProps) {
	if (screen.isInitialLoading) return <LibrarySkeleton />;

	return (
		<RefreshableScroll
			isRefreshing={screen.isRefreshing}
			onRefresh={screen.refresh}
			bottomPadding={screen.bottomPadding}
		>
			<OwnedPlaylistsSection screen={screen} onPlaylistActions={onPlaylistActions} />
			<SharedPlaylistsSection screen={screen} />
		</RefreshableScroll>
	);
}
