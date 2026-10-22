import { z } from 'zod';
import type {
	ControlActionPayload,
	ControlRevokedPayload,
	ListeningStatus,
} from '@/features/music-control/music-control.types.js';
import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import { logger } from '@/shared/utils/logger.js';
import type { AppSocketServer } from '@/realtime/socket-auth.js';

/**
 * Access control for listening status and music control (subject IV.6, CAP-1).
 *
 * The rule is per device (control-access.service.ts, subject IV.2.2): the
 * controller and the owner are mutual friends, and either the owner's "all
 * my devices" switch is on for the controller or the controller holds a
 * license on the device. A failed check refuses. Identity always comes from
 * the socket, never from the payload; unknown payload keys (such as
 * `fromUserId`) are stripped.
 *
 *   listening:subscribe   <ownerId: UUID>   joins `listening:<ownerId>` with
 *                                            access to at least one device;
 *                                            the status covers all devices
 *   listening:unsubscribe <ownerId: UUID>   invalid payloads are ignored
 *   control:action        { targetUserId: UUID, targetDeviceId, action: 'play' | 'pause' }
 *                                            needs access to targetDeviceId
 *
 * Refusals are answered on `listening:error` / `control:error` with
 * `NOT_AUTHORIZED`. When access shrinks (switch or license revoked,
 * unfollow in either direction) the subscription is re-checked and the
 * controller leaves the room only when no device is left. When access
 * shrinks to no device, the controller also gets `control:revoked { ownerId }`
 * (#294).
 *
 * A malformed payload (including a listening:update with a title or artist
 * over 300 characters) is answered on `listening:error` / `control:error`
 * with `{ message, code: 'INVALID_PAYLOAD' }`, before any lookup. Every event
 * is also rate-limited per socket (shared/security/socket-event-limit.ts, `RATE_LIMITED`).
 */

export const listeningTargetSchema = z.uuid();

export const controlActionSchema = z.object({
	targetUserId: z.uuid(),
	targetDeviceId: z.string().min(1).max(128),
	action: z.enum(['play', 'pause']),
}) satisfies z.ZodType<ControlActionPayload>;

/**
 * listening:update from the device that plays. Strings are bounded (#204);
 * older clients may still send a `device` field: it is stripped, and the
 * device comes from the handshake.
 */
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

/**
 * Make every socket of `controllerId` leave `listening:<ownerId>`, after the
 * controller lost access to every device of the owner. Never throws.
 */
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
