import React from 'react';
import { SectionHeader } from '@/shared/theme/components/SectionHeader';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import type { HomeScreen } from '@/features/playlists/features/browse/features/home/homeTypes';
import { PublicPlaylistsBody } from '@/features/playlists/features/browse/features/home/components/presenters/PublicPlaylistsBody';
import GlobeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/globe-solid.svg';

type PublicPlaylistsSectionProps = {
	screen: HomeScreen;
	onPlaylistActions?: (playlist: Playlist) => (() => void) | undefined;
};

export function PublicPlaylistsSection({ screen, onPlaylistActions }: PublicPlaylistsSectionProps) {
	return (
		<>
			<SectionHeader
				icon={GlobeSolid}
				title="Playlists publiques"
				count={screen.publicPlaylists.length}
				open={screen.publicOpen}
				onToggle={screen.togglePublic}
			/>
			{screen.publicOpen && (
				<PublicPlaylistsBody screen={screen} onPlaylistActions={onPlaylistActions} />
			)}
		</>
	);
}
