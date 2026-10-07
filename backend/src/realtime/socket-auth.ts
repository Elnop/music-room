import type { DefaultEventsMap, ExtendedError, Server, Socket } from 'socket.io';
import { z } from 'zod';
import { SessionService } from '@/features/auth/services/session.service.js';
import type { DeviceInfo } from '@/features/music-control/music-control.types.js';
import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';

/**
 * Socket.io handshake authentication (subject IV.6, CAP-1).
 *
 * Contract — the client passes these fields in `io(url, { auth: { ... } })`,
 * all required strings:
 *
 *   token       Supabase access token (JWT), verified with SessionService.verifyToken
 *   deviceId    stable id of the device (non-empty)
 *   deviceName  human-readable device name
 *   platform    ios | android | web ...
 *   model       device model
 *   appVersion  app version
 *
 * The connection is refused with a `connect_error` whose `message` is one of:
 *
 *   NO_TOKEN           `auth` is empty or has no `token`
 *   INVALID_HANDSHAKE  a field is missing or not a string
 *   INVALID_TOKEN      the token is invalid or expired
 *
 * On success `socket.data` holds `{ userId, email, device, appVersion }`. The
 * identity comes only from the verified token: any `userId` sent by the client
 * is ignored. The token is checked once, at the handshake.
 */

export const handshakeAuthSchema = z.object({
	token: z.string().min(1),
	deviceId: z.string().min(1),
	deviceName: z.string(),
	platform: z.string(),
	model: z.string(),
	appVersion: z.string(),
});

export type HandshakeAuth = z.infer<typeof handshakeAuthSchema>;

export interface SocketData {
	userId: string;
	email: string;
	device: DeviceInfo;
	appVersion: string;
}

export type SocketAuthErrorCode = 'NO_TOKEN' | 'INVALID_HANDSHAKE' | 'INVALID_TOKEN';

export type AppSocketServer = Server<
	DefaultEventsMap,
	DefaultEventsMap,
	DefaultEventsMap,
	SocketData
>;
export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

const sessionService = new SessionService();

function refuse(
	socket: AppSocket,
	next: (err?: ExtendedError) => void,
	code: SocketAuthErrorCode
): void {
	socketLogger.event('auth:handshake', socket.id, {
		level: 'warn',
		code,
		action: 'refused',
	});
	next(new Error(code));
}

/**
 * Socket.io middleware (`io.use(authenticateSocket)`): validates the handshake,
 * verifies the token and fills `socket.data`, or refuses the connection.
 */
export async function authenticateSocket(
	socket: AppSocket,
	next: (err?: ExtendedError) => void
): Promise<void> {
	const auth: unknown = socket.handshake.auth;
	const token =
		auth && typeof auth === 'object' ? (auth as Record<string, unknown>).token : undefined;

	if (token === undefined || token === null || token === '') {
		refuse(socket, next, 'NO_TOKEN');
		return;
	}

	const parsed = handshakeAuthSchema.safeParse(auth);
	if (!parsed.success) {
		refuse(socket, next, 'INVALID_HANDSHAKE');
		return;
	}

	const { deviceId, deviceName, platform, model, appVersion } = parsed.data;

	let user: { id: string; email: string };
	try {
		user = await sessionService.verifyToken(parsed.data.token);
	} catch {
		refuse(socket, next, 'INVALID_TOKEN');
		return;
	}

	socket.data = {
		userId: user.id,
		email: user.email,
		device: { deviceId, deviceName, platform, model },
		appVersion,
	};

	socketLogger.auth('handshake', user.id, socket.id, {
		deviceId,
		deviceName,
		platform,
		model,
		appVersion,
		action: 'accepted',
	});
	next();
}
