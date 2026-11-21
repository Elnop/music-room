import React from 'react';
import { PlaylistActionsSheet } from '@/features/playlists/features/editor/shared/action-sheet/components/PlaylistActionsSheet';
import { PlaylistDetailView } from '@/features/playlists/features/editor/features/detail/components/presenters/PlaylistDetailView';
import { DetailHeader } from '@/features/playlists/features/editor/features/detail/components/presenters/DetailHeader';
import { ownerMenu } from '@/features/playlists/features/editor/features/detail/lib/ownerMenu';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import type { TrackActionsSheetComponent } from '@/shared/playback/types/trackActionsSheetTypes';
import type { DetailPage } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';

type PlaylistDetailBodyProps = {
	page: DetailPage;
	playlist: PlaylistWithTracks;
	TrackActionsSheet: TrackActionsSheetComponent;
	onAddTrack: () => void;
};

export function PlaylistDetailBody({
	page,
	playlist,
	TrackActionsSheet,
	onAddTrack,
}: PlaylistDetailBodyProps) {
	return (
		<>
			<PlaylistDetailView
				page={page}
				playlist={playlist}
				header={<DetailHeader page={page} playlist={playlist} onAddTrack={onAddTrack} />}
			/>
			<TrackActionsSheet track={page.tracks.actionTrack} onClose={page.tracks.closeActions} />
			{page.owner.isOwner && (
				<PlaylistActionsSheet
					visible={page.owner.sheetVisible}
					anchor={page.owner.sheetAnchor}
					onClose={page.owner.closeSheet}
					menu={ownerMenu(playlist, page)}
				/>
			)}
		</>
	);
}
