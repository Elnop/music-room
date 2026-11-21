import type { RefObject } from 'react';
import type { TextInput } from 'react-native';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export type SearchQueryState = {
	text: string;
	debounced: string;
	pending: boolean;
};

export type SearchField = {
	inputRef: RefObject<TextInput | null>;
	searchQuery: string;
	onSearchChange: (text: string) => void;
};

export type SearchResults = {
	debouncedQuery: string;
	isLoading: boolean;
	isRefreshing: boolean;
	isError: boolean;
	tracks: SoundCloudTrack[];
	onRefresh: () => void;
};

export type SearchPlaybackHandlers = {
	onPlay: (track: SoundCloudTrack) => void;
	onAddToQueue: (track: SoundCloudTrack) => void;
};

export type SearchTrackHandlers = SearchPlaybackHandlers & {
	onShowActions: (track: SoundCloudTrack, anchor?: MenuAnchor) => void;
};

export type SearchActionSheet = {
	track: AddQueueItemBody | null;
	onClose: () => void;
};

export type SearchTrackActions = {
	trackHandlers: SearchTrackHandlers;
	actionSheet: SearchActionSheet;
};

export type SearchScreen = SearchTrackActions & {
	field: SearchField;
	results: SearchResults;
	bottomPadding: number;
};
