import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import * as tracksApi from '@/features/playlists/services/tracksApi';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import type { AddQueueItemBody } from '@/shared/types/playback';
import { reloadIfOpen, settleTrackEvent } from './playlistCache';

/** Adds a track; the answer is applied like its own `playlist:updated` event. */
export async function addTrack(
	client: QueryClient,
	playlistId: string,
	track: AddQueueItemBody
): Promise<void> {
	const result = await tracksApi.addTrack(playlistId, track);
	await settleTrackEvent(client, {
		playlistId,
		tracksVersion: result.tracksVersion,
		rebalanced: result.rebalanced,
		event: 'track_added',
		track: result.track,
	});
}

/** Optimistic: the answer only advances the version; a refusal reloads the track from the server, then rethrows. */
export async function removeTrack(
	client: QueryClient,
	playlistId: string,
	trackId: string
): Promise<void> {
	client.setQueryData<PlaylistWithTracks>(queryKeys.playlists.detail(playlistId), playlist =>
		playlist ? { ...playlist, tracks: playlist.tracks.filter(t => t.id !== trackId) } : playlist
	);
	try {
		const result = await tracksApi.removeTrack(playlistId, trackId);
		await settleTrackEvent(client, {
			playlistId,
			tracksVersion: result.tracksVersion,
			rebalanced: false,
			event: 'track_removed',
			trackId,
		});
	} catch (error) {
		await reloadIfOpen(client, playlistId);
		throw error;
	}
}
