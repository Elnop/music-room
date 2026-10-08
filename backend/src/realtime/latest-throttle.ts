interface KeyState {
	timer: ReturnType<typeof setTimeout>;
	pending: (() => void) | null;
}

/**
 * Leading + trailing throttle keyed by string.
 *
 * The first call for a key runs at once and opens a window of `windowMs`.
 * Calls received while the window is open replace each other; the latest one
 * runs when the window ends and opens a new window. A key therefore runs at
 * most once per window and always ends on its latest call.
 */
export class LatestThrottle {
	private states = new Map<string, KeyState>();

	constructor(private readonly windowMs: number) {}

	submit(key: string, run: () => void): void {
		const state = this.states.get(key);
		if (state) {
			state.pending = run;
			return;
		}
		this.openWindow(key);
		run();
	}

	/** Drop the key's pending call, timer and window. */
	cancel(key: string): void {
		const state = this.states.get(key);
		if (!state) return;
		clearTimeout(state.timer);
		this.states.delete(key);
	}

	private openWindow(key: string): void {
		const timer = setTimeout(() => this.closeWindow(key), this.windowMs);
		this.states.set(key, { timer, pending: null });
	}

	private closeWindow(key: string): void {
		const state = this.states.get(key);
		this.states.delete(key);
		if (!state?.pending) return;
		this.openWindow(key);
		state.pending();
	}
}
