import React from 'react';
import type { TrackActionsSheetComponent } from '@/shared/playback/types/trackActionsSheetTypes';
import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import { useSoundCloudSearchScreen } from '@/features/search/hooks/useSoundCloudSearchScreen';
import { SearchView } from '@/features/search/components/presenters/SearchView';

export function SearchContainer({
	TrackActionsSheet,
	playback,
}: {
	TrackActionsSheet: TrackActionsSheetComponent;
	playback: PlaybackActions;
}) {
	const {
		inputRef,
		searchQuery,
		debouncedQuery,
		isLoading,
		isRefreshing,
		isError,
		searchResults,
		actionTrack,
		bottomPadding,
		handleSearchChange,
		handleRefresh,
		handleRetry,
		handlePlay,
		handleAddToQueue,
		handleShowActions,
		handleCloseActions,
	} = useSoundCloudSearchScreen(playback);

	return (
		<SearchView
			TrackActionsSheet={TrackActionsSheet}
			inputRef={inputRef}
			searchQuery={searchQuery}
			debouncedQuery={debouncedQuery}
			isLoading={isLoading}
			isRefreshing={isRefreshing}
			isError={isError}
			searchResults={searchResults}
			actionTrack={actionTrack}
			bottomPadding={bottomPadding}
			onSearchChange={handleSearchChange}
			onRefresh={handleRefresh}
			onRetry={handleRetry}
			onPlay={handlePlay}
			onAddToQueue={handleAddToQueue}
			onShowActions={handleShowActions}
			onCloseActions={handleCloseActions}
		/>
	);
}
