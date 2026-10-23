import { z } from 'zod';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { MoveTrackInput } from '@/features/playlists/playlist.validators.js';

// Turns the errors of the migration 016 track operations into API errors.

const addResultSchema = z.object({
	rank: z.string(),
	tracksVersion: z.number().int(),
	addedAt: z.string(),
	rebalanced: z.boolean(),
});
const removeResultSchema = z.object({ tracksVersion: z.number().int() });
const moveResultSchema = z.object({
	rank: z.string(),
	tracksVersion: z.number().int(),
	rebalanced: z.boolean(),
});

type AddTrackRpcResult = z.infer<typeof addResultSchema>;
type RemoveTrackRpcResult = z.infer<typeof removeResultSchema>;
type MoveTrackRpcResult = z.infer<typeof moveResultSchema>;

type Operation = 'add' | 'remove' | 'move';

interface KnownError {
	status: Partial<Record<Operation, number>> & { default: number };
	message: string;
}

const ERRORS: Record<string, KnownError> = {
	PLAYLIST_NOT_FOUND: { status: { default: 404 }, message: 'Playlist not found' },
	TRACK_DUPLICATE: { status: { default: 409 }, message: 'Track already in playlist' },
	TRACK_NOT_IN_PLAYLIST: {
		status: { default: 409, remove: 404 },
		message: 'Track is not in the playlist',
	},
	TRACK_MOVED_CONCURRENTLY: {
		status: { default: 409 },
		message: 'Track was moved by someone else',
	},
	PLAYLIST_REBALANCED: { status: { default: 409 }, message: 'Playlist order changed, reload it' },
};

function toAppError(operation: Operation, message: string): AppError {
	const known = Object.hasOwn(ERRORS, message) ? ERRORS[message] : undefined;
	if (known) {
		return new AppError(known.status[operation] ?? known.status.default, known.message, message);
	}
	logger.error('Track operation failed', { operation, error: message });
	return new AppError(500, 'Track operation failed', 'TRACK_OPERATION_ERROR');
}

interface RpcResponse {
	data: unknown;
	error: { message: string } | null;
}

async function call<T>(
	operation: Operation,
	request: PromiseLike<RpcResponse>,
	schema: z.ZodType<T>
): Promise<T> {
	const { data, error } = await request;
	if (error) throw toAppError(operation, error.message);
	const parsed = schema.safeParse(data);
	if (!parsed.success) throw toAppError(operation, `malformed ${operation} result`);
	return parsed.data;
}

export function addTrackRpc(
	playlistId: string,
	trackId: string,
	addedBy: string | null
): Promise<AddTrackRpcResult> {
	return call(
		'add',
		supabaseAdmin.rpc('playlist_add_track', {
			p_playlist_id: playlistId,
			p_track_id: trackId,
			...(addedBy !== null ? { p_added_by: addedBy } : {}),
		}),
		addResultSchema
	);
}

export function removeTrackRpc(playlistId: string, trackId: string): Promise<RemoveTrackRpcResult> {
	return call(
		'remove',
		supabaseAdmin.rpc('playlist_remove_track', { p_playlist_id: playlistId, p_track_id: trackId }),
		removeResultSchema
	);
}

export function moveTrackRpc(
	playlistId: string,
	trackId: string,
	move: MoveTrackInput
): Promise<MoveTrackRpcResult> {
	return call(
		'move',
		supabaseAdmin.rpc('playlist_move_track', {
			p_playlist_id: playlistId,
			p_track_id: trackId,
			p_expected_version: move.expectedVersion,
			...(move.afterRank !== null ? { p_after_rank: move.afterRank } : {}),
		}),
		moveResultSchema
	);
}
