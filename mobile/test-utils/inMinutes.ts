const MINUTE_MS = 60 * 1000;

export function inMinutes(minutes: number): string {
	return new Date(Date.now() + minutes * MINUTE_MS).toISOString();
}
