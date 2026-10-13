import { z } from 'zod';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { QueueState, QueueStepDirection } from '@/features/queue/queue.types.js';

// Calls the queue functions of migration 021, which all return the full queue
// state, and turns their RAISE EXCEPTION codes into API errors.

const queueStateSchema: z.ZodType<QueueState> = z.object({
	currentItemId: z.uuid().nullable(),
	items: z.array(
		z.object({
			id: z.uuid(),
			rank: z.string(),
			track: z.object({
				trackUri: z.string(),
				title: z.string(),
				artist: z.string(),
				album: z.string().nullable(),
				albumArt: z.string().nullable(),
				durationMs: z.number().int(),
			}),
			sourcePlaylistId: z.uuid().nullable(),
			blockId: z.uuid().nullable(),
			blockDetached: z.boolean(),
		})
	),
});

const ERRORS: Record<string, { status: number; message: string }> = {
	QUEUE_ITEM_NOT_FOUND: { status: 404, message: 'Queue item not found' },
	QUEUE_ITEM_NOT_UPCOMING: {
		status: 409,
		message: 'Only upcoming items can be moved, after an upcoming item',
	},
	QUEUE_END: { status: 409, message: 'No next item in the queue' },
	QUEUE_START: { status: 409, message: 'No previous item in the queue' },
};

function toAppError(operation: string, message: string): AppError {
	const known = Object.hasOwn(ERRORS, message) ? ERRORS[message] : undefined;
	if (known) return new AppError(known.status, known.message, message);
	logger.error('Queue operation failed', { operation, error: message });
	return new AppError(500, 'Queue operation failed', 'QUEUE_OPERATION_ERROR');
}

interface RpcResponse {
	data: unknown;
	error: { message: string } | null;
}

async function call(operation: string, request: PromiseLike<RpcResponse>): Promise<QueueState> {
	const { data, error } = await request;
	if (error) throw toAppError(operation, error.message);
	const parsed = queueStateSchema.safeParse(data);
	if (!parsed.success) throw toAppError(operation, `malformed ${operation} result`);
	return parsed.data;
}

export function getQueueRpc(userId: string): Promise<QueueState> {
	return call('get', supabaseAdmin.rpc('queue_state', { p_user: userId }));
}

export function addQueueItemRpc(userId: string, trackId: string): Promise<QueueState> {
	return call('add', supabaseAdmin.rpc('queue_add_item', { p_user: userId, p_track_id: trackId }));
}

export function removeQueueItemRpc(userId: string, itemId: string): Promise<QueueState> {
	return call(
		'remove',
		supabaseAdmin.rpc('queue_remove_item', { p_user: userId, p_item_id: itemId })
	);
}

export function moveQueueItemRpc(
	userId: string,
	itemId: string,
	afterItemId: string | null
): Promise<QueueState> {
	return call(
		'move',
		supabaseAdmin.rpc('queue_move_item', {
			p_user: userId,
			p_item_id: itemId,
			...(afterItemId !== null ? { p_after_item_id: afterItemId } : {}),
		})
	);
}

export function playQueueItemRpc(userId: string, itemId: string): Promise<QueueState> {
	return call('play', supabaseAdmin.rpc('queue_play_item', { p_user: userId, p_item_id: itemId }));
}

export function stepQueueRpc(userId: string, direction: QueueStepDirection): Promise<QueueState> {
	return call(
		direction,
		supabaseAdmin.rpc('queue_step', { p_user: userId, p_direction: direction })
	);
}
