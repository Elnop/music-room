interface KeyState {
	timer: ReturnType<typeof setTimeout>;
	pending: (() => void) | null;
}

export interface LatestThrottle {
	submit(key: string, run: () => void): void;
	cancel(key: string): void;
}

export function createLatestThrottle(windowMs: number): LatestThrottle {
	const states = new Map<string, KeyState>();

	function openWindow(key: string): void {
		const timer = setTimeout(() => closeWindow(key), windowMs);
		states.set(key, { timer, pending: null });
	}

	function closeWindow(key: string): void {
		const state = states.get(key);
		states.delete(key);
		if (!state?.pending) return;
		openWindow(key);
		state.pending();
	}

	return {
		submit(key, run) {
			const state = states.get(key);
			if (state) {
				state.pending = run;
				return;
			}
			openWindow(key);
			run();
		},
		cancel(key) {
			const state = states.get(key);
			if (!state) return;
			clearTimeout(state.timer);
			states.delete(key);
		},
	};
}
