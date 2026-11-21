const sessionEndListeners = new Set<() => void>();

export function onSessionEnd(listener: () => void): () => void {
	sessionEndListeners.add(listener);
	return () => sessionEndListeners.delete(listener);
}

export function notifySessionEnd(): void {
	for (const listener of sessionEndListeners) listener();
}
