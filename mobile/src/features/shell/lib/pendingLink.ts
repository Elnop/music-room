let pendingPath: string | null = null;

export function keepPendingLink(path: string): void {
	pendingPath = path;
}

export function takePendingLink(): string | null {
	const path = pendingPath;
	pendingPath = null;
	return path;
}

export function clearPendingLink(): void {
	pendingPath = null;
}
