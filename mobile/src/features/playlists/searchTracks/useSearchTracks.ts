import { useCallback, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/keys';
import { STALE } from '@/shared/backend/queryClient';
import { getPlayback } from '@/shared/playback/lib/playbackBridge';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';
import { toTrackInput } from '@/shared/tracks/lib/trackInput';
import { useCachedPlaylist } from '@/features/playlists/hooks/usePlaylistQueries';
import { useDebouncedText, type DebouncedText } from '@/features/playlists/hooks/useDebouncedText';
import { useAddTrack } from '@/features/playlists/hooks/useTrackEdits';
import { searchTracks } from '@/features/playlists/services/trackSearchApi';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import type { SoundCloudTrack } from '@/shared/tracks/lib/soundcloud.types';
import { recordMenuAnchor } from '@/shared/theme/menuAnchorStore';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

export interface SearchTracks {
	search: DebouncedText;
	results: SoundCloudTrack[];
	/** Also true while a typed query waits for its delay. */
	isLoading: boolean;
	isAdded: (track: SoundCloudTrack) => boolean;
	add: (track: SoundCloudTrack) => void;
	addToQueue: (track: SoundCloudTrack) => void;
	actionTrack: AddQueueItemBody | null;
	showActions: (track: SoundCloudTrack, anchor?: MenuAnchor) => void;
	closeActions: () => void;
}

export function useSearchTracks(playlistId: string): SearchTracks {
	const search = useDebouncedText();
	const query = search.settled.trim();
	const found = useQuery({
		queryKey: queryKeys.search.tracks(query),
		queryFn: () => searchTracks(query),
		enabled: query !== '',
		staleTime: STALE.none,
		placeholderData: keepPreviousData,
		retry: false,
	});
	const playlistTracks = useCachedPlaylist(playlistId)?.tracks;
	const addTrack = useAddTrack();
	// Tracks tapped here: checked at once, before the add call ends.
	const [addedHere, setAddedHere] = useState<Set<string>>(new Set());
	// Calls in flight, so a double tap faster than a render sends one call.
	const sendingUris = useRef(new Set<string>());
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);

	const playlistUris = useMemo(
		() => new Set((playlistTracks ?? []).map(track => track.trackUri)),
		[playlistTracks]
	);

	const { mutateAsync } = addTrack;
	const add = useCallback(
		async (track: SoundCloudTrack) => {
			const uri = track.permalink_url;
			if (sendingUris.current.has(uri)) return;
			sendingUris.current.add(uri);
			setAddedHere(prev => new Set(prev).add(uri));
			try {
				await mutateAsync({ playlistId, track: toTrackInput(track) });
			} catch (error) {
				setAddedHere(prev => {
					const next = new Set(prev);
					next.delete(uri);
					return next;
				});
				showError(apiErrorMessage(error, "Impossible d'ajouter le titre à la playlist"));
			} finally {
				sendingUris.current.delete(uri);
			}
		},
		[mutateAsync, playlistId]
	);

	return {
		search,
		results: query ? (found.data ?? []) : [],
		isLoading: found.isFetching || search.pending,
		isAdded: track => addedHere.has(track.permalink_url) || playlistUris.has(track.permalink_url),
		add: useCallback((track: SoundCloudTrack) => void add(track), [add]),
		addToQueue: useCallback((track: SoundCloudTrack) => {
			void getPlayback().addToQueue(toTrackInput(track));
		}, []),
		actionTrack,
		showActions: useCallback((track: SoundCloudTrack, anchor?: MenuAnchor) => {
			recordMenuAnchor(anchor);
			setActionTrack(toTrackInput(track));
		}, []),
		closeActions: () => setActionTrack(null),
	};
}
