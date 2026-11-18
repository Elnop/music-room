import type { AppSocketServer } from '@/realtime/socket-auth.js';
import type { ListeningStatus } from '@/realtime/listening.types.js';

let io: AppSocketServer | null = null;

export function getIO(): AppSocketServer | null {
	return io;
}

export function setIO(server: AppSocketServer): void {
	io = server;
}

/** userId -> deviceId -> status. */
export const listeningStatuses = new Map<string, Map<string, ListeningStatus>>();

export const socketToDevice = new Map<string, { userId: string; deviceId: string }>();

export const deviceToSocket = new Map<string, string>();

export function deviceKey(userId: string, deviceId: string): string {
	return `${userId}:${deviceId}`;
}
