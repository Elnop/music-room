import { z } from 'zod';
import type { ControlActionPayload } from '@/features/music-control/music-control.types.js';
import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import { logger } from '@/shared/utils/logger.js';
import type { AppSocketServer } from '@/realtime/socket-auth.js';

/**
 * Access control for listening status and music control (subject IV.6, CAP-1).
 *
 * The rule is `musicControlService.canControl(controller, owner)`: the
 * controller follows the owner with `can_control_music`. Identity always
 * comes from the socket, never from the payload; unknown payload keys (such
 * as `fromUserId`) are stripped.
 *
 *   listening:subscribe   <ownerId: UUID>   joins `listening:<ownerId>`
 *   listening:unsubscribe <ownerId: UUID>   invalid payloads are ignored
 *   control:action        { targetUserId: UUID, targetDeviceId, action: 'play' | 'pause' }
 *
 * A malformed payload is answered on `listening:error` / `control:error` with
 * `{ message, code: 'INVALID_PAYLOAD' }`, before any lookup.
 */

export const listeningTargetSchema = z.uuid();

export const controlActionSchema = z.object({
	targetUserId: z.uuid(),
	targetDeviceId: z.string().min(1).max(128),
	action: z.enum(['play', 'pause']),
}) satisfies z.ZodType<ControlActionPayload>;

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
 * controller lost control of the owner (revoked or unfollowed). Never throws.
 */
export function leaveListeningRoom(
	io: AppSocketServer,
	controllerId: string,
	ownerId: string
): void {
	const room = listeningRoom(ownerId);
	try {
		io.in(`user:${controllerId}`).socketsLeave(room);
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
