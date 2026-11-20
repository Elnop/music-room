import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { useSearchTracks } from '@/features/playlists/searchTracks/useSearchTracks';
import { SearchTracksView } from '@/features/playlists/searchTracks/components/presenters/SearchTracksView';
import { TrackActionsSheetContainer } from '@/features/playlists/trackActions/components/TrackActionsSheetContainer';

type SearchTracksOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'SearchTracks'>;

export function SearchTracksContainer({ route }: SearchTracksOrchestratorProps) {
	const screen = useSearchTracks(route.params.playlistId);
	const bottomPadding = useBottomPadding();

	return (
		<>
			<SearchTracksView screen={screen} bottomPadding={bottomPadding} />
			<TrackActionsSheetContainer track={screen.actionTrack} onClose={screen.closeActions} />
		</>
	);
}
