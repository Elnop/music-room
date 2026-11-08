import { z } from 'zod';
import type {
	ControlActionPayload,
	ControlRevokedPayload,
	ListeningStatus,
} from '@/realtime/listening.types.js';
import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import { logger } from '@/shared/utils/logger.js';
import type { AppSocketServer } from '@/realtime/socket-auth.js';

export const listeningTargetSchema = z.uuid();

export const controlActionSchema = z.object({
	targetUserId: z.uuid(),
	targetDeviceId: z.string().min(1).max(128),
	action: z.enum(['play', 'pause']),
}) satisfies z.ZodType<ControlActionPayload>;

export const listeningUpdateSchema = z.object({
	track: z
		.object({
			id: z.number(),
			title: z.string().max(300),
			artist: z.string().max(300),
			artworkUrl: z
				.string()
				.max(2048)
				.nullish()
				.transform(url => url ?? null),
		})
		.nullable(),
	isPlaying: z.boolean(),
	positionMs: z.number().int().min(0).max(86_400_000).optional(),
}) satisfies z.ZodType<
	Pick<ListeningStatus, 'track' | 'isPlaying'> & { positionMs?: number },
	unknown
>;

export type ListeningUpdatePayload = z.infer<typeof listeningUpdateSchema>;

export const INVALID_LISTENING_UPDATE_PAYLOAD = {
	message:
		'listening:update expects { track: { id, title, artist, artworkUrl } | null, isPlaying, positionMs? (ms) } (title and artist up to 300 characters)',
	code: 'INVALID_PAYLOAD',
} as const;

export const INVALID_LISTENING_PAYLOAD = {
	message: 'listening:subscribe expects a user id (UUID)',
	code: 'INVALID_PAYLOAD',
} as const;

export const INVALID_CONTROL_PAYLOAD = {
	message: 'control:action expects { targetUserId, targetDeviceId, action: play | pause }',
	code: 'INVALID_PAYLOAD',
} as const;

export function listeningRoom(ownerId: string): string {
	return `listening:${ownerId}`;
}

export function leaveListeningRoom(
	io: AppSocketServer,
	controllerId: string,
	ownerId: string
): void {
	const room = listeningRoom(ownerId);
	try {
		io.in(`user:${controllerId}`).socketsLeave(room);
		const payload: ControlRevokedPayload = { ownerId };
		io.to(`user:${controllerId}`).emit('control:revoked', payload);
		socketLogger.broadcast('listening_access_revoked', {
			controllerId,
			ownerId,
			room,
			action: 'evicted',
		});
	} catch (error) {
		logger.error('Listening room eviction failed', { error, controllerId, ownerId });
	}
}
