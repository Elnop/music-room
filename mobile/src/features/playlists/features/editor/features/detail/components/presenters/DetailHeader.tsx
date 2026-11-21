import React from 'react';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { PlaylistHeader } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistHeader';
import { PlaylistWideHeader } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistWideHeader';
import { PlayPlaylistButton } from '@/features/playlists/features/editor/features/detail/components/presenters/PlayPlaylistButton';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import type { DetailPage } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';

type DetailHeaderProps = {
	page: Pick<DetailPage, 'tracks' | 'play'>;
	playlist: PlaylistWithTracks;
	onAddTrack: () => void;
};

export function DetailHeader({ page, playlist, onAddTrack }: DetailHeaderProps) {
	const Header = useBreakpoint().isWide ? PlaylistWideHeader : PlaylistHeader;

	return (
		<Header
			playlist={playlist}
			canEdit={page.tracks.canEdit}
			onAddTrack={onAddTrack}
			playButton={<PlayPlaylistButton play={page.play} />}
		/>
	);
}
