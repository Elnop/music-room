import { z } from 'zod';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { logger } from '@/shared/utils/logger.js';
import * as realtime from '@/realtime/emitters/queue.emitters.js';
import { getQueueRpc } from '@/features/queue/utils/queue-rpc.js';

/** The playlist change to mirror in the queues: one function of migration 023 each. */
type PlaylistTrackChange = 'added' | 'removed' | 'moved';

const SYNC_FUNCTIONS = {
	added: 'queue_sync_track_added',
	removed: 'queue_sync_track_removed',
	moved: 'queue_sync_track_moved',
} as const;

const affectedUsersSchema = z.array(z.uuid());

/**
 * Applies a playlist track change to the non-detached queue blocks of that
 * playlist, in every user's queue (#278), then sends each affected user their
 * new queue as `queue:updated`. Runs after the playlist operation succeeded:
 * every error is logged and swallowed, never thrown back to the caller.
 */
export async function syncPlaylistChange(
	change: PlaylistTrackChange,
	playlistId: string,
	trackId: string
): Promise<void> {
	let userIds: string[];
	try {
		const { data, error } = await supabaseAdmin.rpc(SYNC_FUNCTIONS[change], {
			p_playlist_id: playlistId,
			p_track_id: trackId,
		});
		if (error) throw new Error(error.message);
		userIds = affectedUsersSchema.parse(data);
	} catch (error) {
		logger.error('Queue sync failed', {
			change,
			playlistId,
			trackId,
			error: errorMessage(error),
		});
		return;
	}

	await Promise.all(userIds.map(userId => notify(userId, change, playlistId)));
}

async function notify(userId: string, change: PlaylistTrackChange, playlistId: string) {
	try {
		const state = await getQueueRpc(userId);
		logger.info('Queue synced with playlist', {
			userId,
			change,
			playlistId,
			items: state.items.length,
		});
		realtime.notifyQueueUpdate(userId, state);
	} catch (error) {
		logger.error('Queue sync notification failed', {
			userId,
			change,
			playlistId,
			error: errorMessage(error),
		});
	}
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
