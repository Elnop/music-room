import { useState } from 'react';
import type { AddTracker } from '@/features/playlists/features/editor/features/search-tracks/searchTracksTypes';

export function useAddedUris(): { uris: Set<string>; tracker: AddTracker } {
	const [uris, setUris] = useState<Set<string>>(new Set());
	const [tracker] = useState<AddTracker>(() => ({
		sending: new Set<string>(),
		mark: (uri) => setUris((prev) => new Set(prev).add(uri)),
		unmark: (uri) =>
			setUris((prev) => {
				const next = new Set(prev);
				next.delete(uri);
				return next;
			}),
	}));
	return { uris, tracker };
}
