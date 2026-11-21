import React from 'react';
import type { TrackActionsSheetComponent } from '@/shared/playback/types/trackActionsSheetTypes';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import { useSoundCloudSearchScreen } from '@/features/search/hooks/useSoundCloudSearchScreen';
import { SearchView } from '@/features/search/components/presenters/SearchView';

type SearchContainerProps = {
	TrackActionsSheet: TrackActionsSheetComponent;
	playback: PlaybackActions;
};

export function SearchContainer({ TrackActionsSheet, playback }: SearchContainerProps) {
	const screen = useSoundCloudSearchScreen(playback);

	return <SearchView TrackActionsSheet={TrackActionsSheet} {...screen} />;
}
