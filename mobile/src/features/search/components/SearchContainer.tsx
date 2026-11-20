import React from 'react';
import { useSoundCloudSearchScreen } from '@/features/search/hooks/useSoundCloudSearchScreen';
import { SearchView } from '@/features/search/components/presenters/SearchView';

export function SearchContainer() {
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
	} = useSoundCloudSearchScreen();

	return (
		<SearchView
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
