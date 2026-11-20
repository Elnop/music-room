type BackendErrorLevel = 'warn' | 'error';

type BackendErrorListener = (level: BackendErrorLevel, message: string, context?: unknown) => void;

const listeners = new Set<BackendErrorListener>();

export function onBackendError(listener: BackendErrorListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function reportBackendError(level: BackendErrorLevel, message: string, context?: unknown): void {
	for (const listener of listeners) listener(level, message, context);
}
