interface ListeningSocket {
	connected: boolean;
	emit: (event: string, ...args: unknown[]) => unknown;
}

/** Per socket: a new connection starts from zero. */
const holders = new WeakMap<ListeningSocket, Map<string, number>>();

// The server keeps one membership per socket, so the profile and the remote target share it through this count.
export function acquireListening(socket: ListeningSocket, ownerId: string): void {
	let counts = holders.get(socket);
	if (!counts) {
		counts = new Map();
		holders.set(socket, counts);
	}
	const count = counts.get(ownerId) ?? 0;
	counts.set(ownerId, count + 1);
	if (count === 0) socket.emit('listening:subscribe', ownerId);
}

/** A disconnect already left the room: no unsubscribe then. */
export function releaseListening(socket: ListeningSocket, ownerId: string): void {
	const counts = holders.get(socket);
	const count = counts?.get(ownerId) ?? 0;
	if (!counts || count === 0) return;
	if (count > 1) {
		counts.set(ownerId, count - 1);
		return;
	}
	counts.delete(ownerId);
	if (socket.connected) socket.emit('listening:unsubscribe', ownerId);
}
