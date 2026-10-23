interface KeyState {
	timer: ReturnType<typeof setTimeout>;
	pending: (() => void) | null;
}

export interface LatestThrottle {
	/** Run `run` now if the key's window is closed, else keep it as the key's latest call. */
	submit(key: string, run: () => void): void;
	/** Drop the key's pending call, timer and window. */
	cancel(key: string): void;
}

/** Leading + trailing throttle: a key runs at most once per `windowMs` and always ends on its latest call. */
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
