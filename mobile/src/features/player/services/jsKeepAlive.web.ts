// Browser variant: the headless task exists only on Android, and a tab keeps its timers.

export function registerJsKeepAliveTask(): void {}

export const jsKeepAlive = {
	start: () => undefined,
	stop: () => undefined,
};
