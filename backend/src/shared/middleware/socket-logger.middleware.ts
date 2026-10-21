import { z } from 'zod';
import { logger } from '@/shared/utils/logger.js';

/**
 * Socket Logger Middleware
 * Provides structured logging helpers for Socket.io events
 * Unifies logging format between Socket events and HTTP requests
 *
 * Usage:
 *   socketLogger.connection(socket.id, "websocket", { action: "connected" })
 *   socketLogger.auth("register", userId, socket.id, { deviceId, deviceName })
 *   socketLogger.event("listening:update", socket.id, { userId, track, isPlaying })
 */

/**
 * Log socket connection events
 * @param socketId - Socket ID
 * @param transport - Transport type (websocket, polling)
 * @param metadata - Additional metadata
 */
function connectionLog(
	socketId: string,
	transport: string,
	metadata?: Record<string, unknown>
): void {
	logger.info('[Socket] connection', {
		socketId,
		transport,
		...metadata,
	});
}

/**
 * Log socket disconnection events
 * @param socketId - Socket ID
 * @param reason - Disconnect reason
 * @param metadata - Additional metadata
 */
function disconnectLog(socketId: string, reason: string, metadata?: Record<string, unknown>): void {
	logger.info('[Socket] disconnect', {
		socketId,
		reason,
		...metadata,
	});
}

/**
 * Log authentication events (register, subscribe, etc.)
 * @param action - Auth action type (register, subscribe, unsubscribe)
 * @param userId - User ID
 * @param socketId - Socket ID
 * @param metadata - Additional metadata
 */
function authLog(
	action: string,
	userId: string,
	socketId: string,
	metadata?: Record<string, unknown>
): void {
	logger.info(`[Socket] auth:${action}`, {
		socketId,
		userId,
		...metadata,
	});
}

/**
 * Log generic socket events
 * @param eventName - Event name (listening:update, playlist:join, etc.)
 * @param socketId - Socket ID
 * @param metadata - Event metadata
 */
function eventLog(eventName: string, socketId: string, metadata?: Record<string, unknown>): void {
	const level = metadata?.level === 'warn' ? 'warn' : 'info';
	const cleanedMeta = { ...metadata };
	delete cleanedMeta.level;

	if (level === 'warn') {
		logger.warn(`[Socket] ${eventName}`, {
			socketId,
			...cleanedMeta,
		});
	} else {
		logger.info(`[Socket] ${eventName}`, {
			socketId,
			...cleanedMeta,
		});
	}
}

/**
 * Client identity set on `socket.data` by the handshake (see realtime/socket-auth.ts)
 */
interface SocketClientContext {
	userId: string;
	device: { deviceId: string; platform: string; model: string };
	appVersion: string;
}

const eventNameSchema = z.string().regex(/^[\w:.-]{1,64}$/);
const INVALID_EVENT_NAME = '<invalid-event-name>';

/**
 * An event name from the client, safe to log: kept only when it looks like an
 * event name, so a huge or multi-line string never reaches the log file.
 */
export function loggableEventName(eventName: unknown): string {
	const name = eventNameSchema.safeParse(eventName);
	return name.success ? name.data : INVALID_EVENT_NAME;
}

/**
 * Log every incoming socket event with the client's platform, device and app
 * version (subject IV.6), with the same field names as the HTTP action logger.
 * Event arguments are never logged.
 * @param socketId - Socket ID
 * @param eventName - Incoming event name, as sent by the client
 * @param client - Identity from socket.data
 */
function incomingLog(socketId: string, eventName: unknown, client: SocketClientContext): void {
	logger.info(`[Socket] in:${loggableEventName(eventName)}`, {
		socketId,
		userId: client.userId,
		platform: client.device.platform,
		device: client.device.model,
		deviceId: client.device.deviceId,
		appVersion: client.appVersion,
	});
}

/**
 * Log socket errors
 * @param socketId - Socket ID
 * @param error - Error object
 * @param metadata - Additional metadata
 */
function errorLog(socketId: string, error: Error, metadata?: Record<string, unknown>): void {
	logger.error(`[Socket] error`, {
		socketId,
		error: error.message,
		stack: error.stack,
		...metadata,
	});
}

/**
 * Log initialization events
 * @param message - Initialization message
 * @param metadata - Additional metadata
 */
function initLog(message: string, metadata?: Record<string, unknown>): void {
	logger.info(`[Socket] ${message}`, metadata);
}

/**
 * Log broadcast events
 * @param eventType - Type of broadcast (device_status, permissions, etc.)
 * @param metadata - Broadcast metadata
 */
function broadcastLog(eventType: string, metadata: Record<string, unknown>): void {
	logger.info(`[Socket] broadcast:${eventType}`, metadata);
}

/**
 * Exported namespace for structured socket logging
 */
export const socketLogger = {
	connection: connectionLog,
	disconnect: disconnectLog,
	auth: authLog,
	event: eventLog,
	incoming: incomingLog,
	error: errorLog,
	init: initLog,
	broadcast: broadcastLog,
};
