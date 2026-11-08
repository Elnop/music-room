interface ListeningSocket {
	connected: boolean;
	emit: (event: string, ...args: unknown[]) => unknown;
}

const holders = new WeakMap<ListeningSocket, Map<string, number>>();

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
