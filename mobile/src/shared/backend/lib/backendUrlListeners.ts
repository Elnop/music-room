type BackendUrlListener = (url: string) => void;

const listeners = new Set<BackendUrlListener>();

export function onBackendUrlChange(listener: BackendUrlListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function notifyBackendUrlChange(url: string): void {
	for (const listener of listeners) listener(url);
}
