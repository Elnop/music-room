import { z } from 'zod';
import { logger } from '@/shared/utils/logger.js';

/**
 * Socket Logger Middleware
 * Provides structured logging helpers for Socket.io events.
 */

function connectionLog(
	socketId: string,
	transport: string,
	metadata?: Record<string, unknown>
): void {
	logger.info('[Socket] connection', { socketId, transport, ...metadata });
}

function disconnectLog(socketId: string, reason: string, metadata?: Record<string, unknown>): void {
	logger.info('[Socket] disconnect', { socketId, reason, ...metadata });
}

function authLog(
	action: string,
	userId: string,
	socketId: string,
	metadata?: Record<string, unknown>
): void {
	logger.info(`[Socket] auth:${action}`, { socketId, userId, ...metadata });
}

function eventLog(eventName: string, socketId: string, metadata?: Record<string, unknown>): void {
	const level = metadata?.level === 'warn' ? 'warn' : 'info';
	const cleanedMeta = { ...metadata };
	delete cleanedMeta.level;

	if (level === 'warn') {
		logger.warn(`[Socket] ${eventName}`, { socketId, ...cleanedMeta });
	} else {
		logger.info(`[Socket] ${eventName}`, { socketId, ...cleanedMeta });
	}
}

/** Client identity set on `socket.data` by handshake (realtime/socket-auth.ts) */
interface SocketClientContext {
	userId: string;
	device: { deviceId: string; platform: string; model: string };
	appVersion: string;
}

const eventNameSchema = z.string().regex(/^[\w:.-]{1,64}$/);
const INVALID_EVENT_NAME = '<invalid-event-name>';

/** Safe event name: kept only when matching pattern to avoid huge strings. */
export function loggableEventName(eventName: unknown): string {
	const name = eventNameSchema.safeParse(eventName);
	return name.success ? name.data : INVALID_EVENT_NAME;
}

/**
 * Log every incoming socket event with client telemetry (subject IV.6).
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

function errorLog(socketId: string, error: Error, metadata?: Record<string, unknown>): void {
	logger.error(`[Socket] error`, {
		socketId,
		error: error.message,
		stack: error.stack,
		...metadata,
	});
}

function initLog(message: string, metadata?: Record<string, unknown>): void {
	logger.info(`[Socket] ${message}`, metadata);
}

function broadcastLog(eventType: string, metadata: Record<string, unknown>): void {
	logger.info(`[Socket] broadcast:${eventType}`, metadata);
}

/** Exported namespace for structured socket logging */
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
