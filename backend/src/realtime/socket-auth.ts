import type { DefaultEventsMap, ExtendedError, Server, Socket } from 'socket.io';
import { z } from 'zod';
import * as sessionService from '@/features/auth/services/session.service.js';
import {
	TokenVerifyLimitError,
	verifyTokenLimited,
} from '@/features/auth/utils/token-verify-limiter.js';
import type { DeviceInfo } from '@/features/music-control/music-control.types.js';
import * as deviceService from '@/features/music-control/services/device.service.js';
import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import { clientIp } from '@/shared/config/trust-proxy.js';

/**
 * Socket.io handshake authentication (subject IV.6, CAP-1).
 *
 * Contract — the client passes these fields in `io(url, { auth: { ... } })`,
 * all required strings:
 *
 *   token       Supabase access token (JWT), verified with session.service.ts verifyToken
 *   deviceId    stable id of the device (1 to 128 characters, devices.device_id)
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
 *   TOO_MANY_ATTEMPTS  too many failed token verifications from this IP
 *                      (RATE_LIMIT_TOKEN_*): refused without verifying the
 *                      token until the window ends; refreshing does not help
 *   DEVICE_REGISTRATION_FAILED  the device could not be recorded in `devices`;
 *                      Socket.io does not retry a refusal, so the client retries
 *
 * On success the device is recorded in `devices` (one row per user and
 * deviceId, `last_seen_at` refreshed) before the connection is accepted, and
 * `socket.data` holds `{ userId, email, device, appVersion }`, where
 * `device.deviceName` is the name the owner gave the device when set, else
 * the handshake `deviceName` (#352). The
 * identity comes only from the verified token: any `userId` sent by the client
 * is ignored. The token is checked once, at the handshake.
 */

const handshakeAuthSchema = z.object({
	token: z.string().min(1),
	deviceId: z.string().min(1).max(128),
	deviceName: z.string(),
	platform: z.string(),
	model: z.string(),
	appVersion: z.string(),
});

export interface SocketData {
	userId: string;
	email: string;
	device: DeviceInfo;
	appVersion: string;
}

type SocketAuthErrorCode =
	| 'NO_TOKEN'
	| 'INVALID_HANDSHAKE'
	| 'INVALID_TOKEN'
	| 'TOO_MANY_ATTEMPTS'
	| 'DEVICE_REGISTRATION_FAILED';

export type AppSocketServer = Server<
	DefaultEventsMap,
	DefaultEventsMap,
	DefaultEventsMap,
	SocketData
>;
export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

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
		user = await verifyTokenLimited(parsed.data.token, clientIp(socket.request), token =>
			sessionService.verifyToken(token)
		);
	} catch (error) {
		refuse(
			socket,
			next,
			error instanceof TokenVerifyLimitError ? 'TOO_MANY_ATTEMPTS' : 'INVALID_TOKEN'
		);
		return;
	}

	const device: DeviceInfo = { deviceId, deviceName, platform, model };
	try {
		// The stored device keeps the system name; the socket carries the name
		// to show, the owner's custom one when set (#352).
		device.deviceName = await deviceService.recordConnection(user.id, device);
	} catch {
		// device.service has already logged the database error.
		refuse(socket, next, 'DEVICE_REGISTRATION_FAILED');
		return;
	}

	socket.data = {
		userId: user.id,
		email: user.email,
		device,
		appVersion,
	};

	socketLogger.auth('handshake', user.id, socket.id, {
		deviceId,
		deviceName: device.deviceName,
		platform,
		model,
		appVersion,
		action: 'accepted',
	});
	next();
}
