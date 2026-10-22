import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { loggableEventName, socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import { isOriginAllowed, isSameOrigin } from '@/shared/config/cors.config.js';
import {
	createSocketEventLimiter,
	rateLimitedErrorFor,
} from '@/shared/security/socket-event-limit.js';
import {
	authenticateSocket,
	type AppSocket,
	type AppSocketServer,
} from '@/realtime/socket-auth.js';
import { handleDisconnect, registerDevice } from '@/realtime/devices.js';
import { registerPlaylistHandlers } from '@/realtime/handlers/playlist.handler.js';
import { registerListeningHandlers } from '@/realtime/handlers/listening.handler.js';
import { registerControlHandlers } from '@/realtime/handlers/control.handler.js';
import { setIO } from '@/realtime/state.js';

/**
 * Socket.io server bootstrap: origin check, handshake authentication, the
 * per-event log and rate limit, then the device registry and one handler
 * module per domain (playlist, listening, control). Features reach the
 * server through the modules in `realtime/emitters/`.
 */

/**
 * Every incoming event, including those added later, is logged with the
 * handshake's platform, device and app version (subject IV.6), then counted
 * against the socket's per-event limit (#204).
 */
function limitEvents(socket: AppSocket): void {
	const checkEvent = createSocketEventLimiter();
	socket.use(([eventName]: unknown[], next) => {
		socketLogger.incoming(socket.id, eventName, socket.data);

		const name = typeof eventName === 'string' ? eventName : '';
		const decision = checkEvent(name);
		if (decision === 'allowed') {
			next();
			return;
		}

		const refusal = rateLimitedErrorFor(name);
		if (refusal) socket.emit(refusal.event, refusal.payload);
		if (decision === 'limited') {
			socketLogger.event(loggableEventName(name), socket.id, {
				level: 'warn',
				action: 'rate_limited',
			});
		}
	});
}

function onConnection(socket: AppSocket): void {
	const transport = socket.conn.transport.name;
	socketLogger.connection(socket.id, transport, { action: 'connected' });

	socket.conn.on('upgrade', (newTransport: { name: string }) => {
		socketLogger.event('transport:upgraded', socket.id, {
			from: transport,
			to: newTransport.name,
			action: 'upgraded',
		});
	});

	limitEvents(socket);

	registerDevice(socket);
	registerPlaylistHandlers(socket);
	registerListeningHandlers(socket);
	registerControlHandlers(socket);

	socket.on('disconnect', reason => {
		handleDisconnect(socket);
		socketLogger.disconnect(socket.id, reason, { action: 'disconnected' });
	});

	socket.on('error', error => {
		socketLogger.error(socket.id, error, { action: 'error' });
	});
}

/**
 * Initialize Socket.io server
 */
export function initialize(httpServer: HTTPServer): void {
	socketLogger.init('initializing', { cors: 'ALLOWED_ORIGINS' });

	const io: AppSocketServer = new SocketIOServer(httpServer, {
		// Same origin rule as the HTTP API (cors.config.ts). `cors` only covers
		// the polling transport's headers; `allowRequest` also refuses a
		// browser WebSocket from a disallowed origin. A same-origin request is
		// not cross-origin: the Android app sends the backend's own address.
		cors: {
			origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
			methods: ['GET', 'POST'],
			credentials: true,
		},
		allowRequest: (req, callback) => {
			const allowed =
				isOriginAllowed(req.headers.origin) || isSameOrigin(req.headers.origin, req.headers.host);
			if (!allowed) {
				socketLogger.event('connection:refused', 'N/A', {
					level: 'warn',
					origin: req.headers.origin,
					action: 'origin_not_allowed',
				});
			}
			callback(allowed ? null : 'ORIGIN_NOT_ALLOWED', allowed);
		},
		transports: ['websocket', 'polling'],
		pingTimeout: 60000,
		pingInterval: 25000,
	});
	setIO(io);

	// Every connection must carry a valid token (see socket-auth.ts).
	io.use((socket, next) => {
		authenticateSocket(socket, next).catch(() => next(new Error('INVALID_TOKEN')));
	});

	io.on('connection', onConnection);

	socketLogger.init('initialized', { action: 'ready' });
}
