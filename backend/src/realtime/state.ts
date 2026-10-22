import type { AppSocketServer } from '@/realtime/socket-auth.js';
import type { ListeningStatus } from '@/realtime/listening.types.js';

/**
 * Module state of the Socket.io server, shared by the bootstrap, the handlers
 * and the emitters. Multi-device: a user may have several devices connected,
 * each keyed `<userId>:<deviceId>`.
 */

let io: AppSocketServer | null = null;

/** The Socket.io server, null before socket-server.ts initialize(). */
export function getIO(): AppSocketServer | null {
	return io;
}

export function setIO(server: AppSocketServer): void {
	io = server;
}

/** Listening status of each connected device, by user then deviceId. */
export const listeningStatuses = new Map<string, Map<string, ListeningStatus>>();

/** The device each socket registered at its handshake. */
export const socketToDevice = new Map<string, { userId: string; deviceId: string }>();

/** The current socket of each device, by `<userId>:<deviceId>`. */
export const deviceToSocket = new Map<string, string>();

export function deviceKey(userId: string, deviceId: string): string {
	return `${userId}:${deviceId}`;
}
