import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TrackActionsSheet } from '@/app/TrackActionsSheet';
import { SearchTracksContainer } from '@/features/playlists/features/editor/features/search-tracks/components/SearchTracksContainer';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/playlistTypes';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';

type SearchTracksScreenProps = NativeStackScreenProps<PlaylistStackParamList, 'SearchTracks'> & {
	playback: PlaybackActions;
};

export function SearchTracksScreen(props: SearchTracksScreenProps) {
	return <SearchTracksContainer {...props} TrackActionsSheet={TrackActionsSheet} />;
}
