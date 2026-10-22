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

/**
 * Leading + trailing throttle keyed by string.
 *
 * The first call for a key runs at once and opens a window of `windowMs`.
 * Calls received while the window is open replace each other; the latest one
 * runs when the window ends and opens a new window. A key therefore runs at
 * most once per window and always ends on its latest call.
 */
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
