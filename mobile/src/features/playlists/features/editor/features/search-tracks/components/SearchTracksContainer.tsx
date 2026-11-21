import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/playlistTypes';
import { useSearchTracks } from '@/features/playlists/features/editor/features/search-tracks/hooks/useSearchTracks';
import { SearchTracksView } from '@/features/playlists/features/editor/features/search-tracks/components/presenters/SearchTracksView';
import type { TrackActionsSheetComponent } from '@/shared/playback/types/trackActionsSheetTypes';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';

type SearchTracksOrchestratorProps = NativeStackScreenProps<
	PlaylistStackParamList,
	'SearchTracks'
> & {
	TrackActionsSheet: TrackActionsSheetComponent;
	playback: PlaybackActions;
};

export function SearchTracksContainer({
	route,
	TrackActionsSheet,
	playback,
}: SearchTracksOrchestratorProps) {
	const screen = useSearchTracks(route.params.playlistId, playback);
	const bottomPadding = useBottomPadding();

	return (
		<>
			<SearchTracksView screen={screen} bottomPadding={bottomPadding} />
			<TrackActionsSheet track={screen.actionTrack} onClose={screen.closeActions} />
		</>
	);
}
