import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import type {
	PlaylistUpdatedEvent,
	PlaylistWithTracks,
} from '@/features/playlists/shared/playlist/playlistTypes';
import { applyPlaylistEvent } from '@/features/playlists/shared/playlist/lib/playlistSync';
import { reloadIfOnScreen } from '@/features/playlists/shared/playlist/lib/playlistCache';

function applyTrackEvent(
	client: QueryClient,
	event: PlaylistUpdatedEvent,
): 'applied' | 'ignored' | 'reload' {
	const current = client.getQueryData<PlaylistWithTracks>(
		queryKeys.playlists.detail(event.playlistId),
	);
	if (!current) return 'ignored';
	const next = applyPlaylistEvent(current, event);
	if (next === 'ignore') return 'ignored';
	if (next === 'reload') return 'reload';
	client.setQueryData(queryKeys.playlists.detail(event.playlistId), next);
	return 'applied';
}

export async function settleTrackEvent(
	client: QueryClient,
	event: PlaylistUpdatedEvent,
): Promise<void> {
	if (applyTrackEvent(client, event) === 'reload') await reloadIfOnScreen(client, event.playlistId);
}
