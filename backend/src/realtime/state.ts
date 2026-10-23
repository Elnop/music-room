import type { AppSocketServer } from '@/realtime/socket-auth.js';
import type { ListeningStatus } from '@/realtime/listening.types.js';

// A user may have several devices connected, each keyed `<userId>:<deviceId>`.

let io: AppSocketServer | null = null;

/** Null before socket-server.ts initialize(). */
export function getIO(): AppSocketServer | null {
	return io;
}

export function setIO(server: AppSocketServer): void {
	io = server;
}

/** By user then deviceId. */
export const listeningStatuses = new Map<string, Map<string, ListeningStatus>>();

export const socketToDevice = new Map<string, { userId: string; deviceId: string }>();

/** By `<userId>:<deviceId>`. */
export const deviceToSocket = new Map<string, string>();

export function deviceKey(userId: string, deviceId: string): string {
	return `${userId}:${deviceId}`;
}
