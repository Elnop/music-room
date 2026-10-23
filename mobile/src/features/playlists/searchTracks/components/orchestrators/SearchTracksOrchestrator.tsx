import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { useSearchTracks } from '@/features/playlists/searchTracks/hooks/useSearchTracks';
import { SearchTracksView } from '@/features/playlists/searchTracks/components/presenters/SearchTracksView';
import { TrackActionsSheet } from '@/features/playlists/trackActions/components/orchestrators/TrackActionsSheet';

type SearchTracksOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'SearchTracks'>;

export function SearchTracksOrchestrator({ route }: SearchTracksOrchestratorProps) {
	const screen = useSearchTracks(route.params.playlistId);
	const bottomPadding = useBottomPadding();

	return (
		<>
			<SearchTracksView screen={screen} bottomPadding={bottomPadding} />
			<TrackActionsSheet track={screen.actionTrack} onClose={screen.closeActions} />
		</>
	);
}
