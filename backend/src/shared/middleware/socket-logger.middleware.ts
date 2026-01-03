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
export function connectionLog(
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
export function disconnectLog(
	socketId: string,
	reason: string,
	metadata?: Record<string, unknown>
): void {
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
export function authLog(
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
export function eventLog(
	eventName: string,
	socketId: string,
	metadata?: Record<string, unknown>
): void {
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
 * Log socket errors
 * @param socketId - Socket ID
 * @param error - Error object
 * @param metadata - Additional metadata
 */
export function errorLog(socketId: string, error: Error, metadata?: Record<string, unknown>): void {
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
export function initLog(message: string, metadata?: Record<string, unknown>): void {
	logger.info(`[Socket] ${message}`, metadata);
}

/**
 * Log broadcast events
 * @param eventType - Type of broadcast (device_status, permissions, etc.)
 * @param metadata - Broadcast metadata
 */
export function broadcastLog(eventType: string, metadata: Record<string, unknown>): void {
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
	error: errorLog,
	init: initLog,
	broadcast: broadcastLog,
};
