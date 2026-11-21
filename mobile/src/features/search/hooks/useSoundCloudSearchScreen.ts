import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useSearchInputFocus } from '@/features/search/hooks/useSearchInputFocus';
import { useSearchQuery } from '@/features/search/hooks/useSearchQuery';
import { useSearchResults } from '@/features/search/hooks/useSearchResults';
import { useSearchTrackActions } from '@/features/search/hooks/useSearchTrackActions';
import type { SearchScreen } from '@/features/search/searchTypes';

export function useSoundCloudSearchScreen(playback: PlaybackActions): SearchScreen {
	const inputRef = useSearchInputFocus();
	const search = useSearchQuery();
	const results = useSearchResults(search.query, search.settle);
	const trackActions = useSearchTrackActions(playback);
	const bottomPadding = useBottomPadding();

	return {
		...trackActions,
		field: { inputRef, searchQuery: search.query.text, onSearchChange: search.onSearchChange },
		results,
		bottomPadding,
	};
}
