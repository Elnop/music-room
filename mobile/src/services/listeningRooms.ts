/** What the ref-count needs of a Socket.io client socket. */
interface ListeningSocket {
	connected: boolean;
	emit: (event: string, ...args: unknown[]) => unknown;
}

/** Holders per owner, per socket: a new connection (new socket) starts from zero. */
const holders = new WeakMap<ListeningSocket, Map<string, number>>();

/**
 * Join `listening:<ownerId>` for one holder (#297). The server keeps a single
 * room membership per socket and `listening:unsubscribe` leaves it outright,
 * so the friend profile and the remote target share it through this count:
 * `listening:subscribe` goes out on the first holder only.
 */
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

/**
 * Release one holder; `listening:unsubscribe` goes out when the last one
 * leaves, if the socket is still connected (a disconnect already left the room).
 */
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
