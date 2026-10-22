import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePlayerHeight } from '@/shared/services/playbackBridge';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { useSearchTracks } from '@/features/playlists/searchTracks/hooks/useSearchTracks';
import { SearchTracksView } from '@/features/playlists/searchTracks/components/presenters/SearchTracksView';
import { TrackActionsSheet } from '@/features/playlists/trackActions/components/orchestrators/TrackActionsSheet';

type SearchTracksOrchestratorProps = NativeStackScreenProps<PlaylistStackParamList, 'SearchTracks'>;

/** « Ajouter des titres » to a playlist. */
export function SearchTracksOrchestrator({ route }: SearchTracksOrchestratorProps) {
	const screen = useSearchTracks(route.params.playlistId);
	const playerHeight = usePlayerHeight();

	return (
		<>
			<SearchTracksView screen={screen} playerHeight={playerHeight} />
			<TrackActionsSheet track={screen.actionTrack} onClose={screen.closeActions} />
		</>
	);
}
