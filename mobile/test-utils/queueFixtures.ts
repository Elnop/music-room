import type { QueueItem, QueueState } from '@/shared/playback/types/queueTypes';

let nextVersion = 0;

export function queueItem(id: string): QueueItem {
	return {
		id,
		rank: id,
		track: {
			trackUri: `https://soundcloud.com/artist/${id}`,
			title: `Title ${id}`,
			artist: 'Artist',
			album: null,
			albumArt: null,
			durationMs: 1000,
		},
		sourcePlaylistId: null,
		blockId: null,
		blockDetached: false,
	};
}

export function queueState(currentItemId: string | null, ids = ['a', 'b', 'c']): QueueState {
	return {
		ownerId: 'owner',
		version: ++nextVersion,
		currentItemId,
		items: ids.map(queueItem),
	};
}

export function queueItemBody(id: string) {
	const { trackUri, title, artist, durationMs } = queueItem(id).track;
	return { trackUri, title, artist, durationMs };
}
