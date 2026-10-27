import type { MediaElement } from '@/features/player/services/mediaElement';

/** A browser audio element: `load` fires the events of a stream that loaded, `play` follows `playResult`. */
export class FakeMediaElement implements MediaElement {
	src = '';
	currentTime = 0;
	volume = 1;
	preload = '';
	duration = NaN;
	paused = true;
	ended = false;
	readyState = 0;
	error: unknown = null;
	nativeHls = '';
	playResult: () => Promise<void> = () => Promise.resolve();
	private readonly listeners = new Map<string, (() => void)[]>();

	play = jest.fn(() => {
		const result = this.playResult();
		return result.then(() => {
			this.paused = false;
			this.ended = false;
			this.emit('play');
			this.emit('playing');
		});
	});

	pause = jest.fn(() => {
		if (this.paused) return;
		this.paused = true;
		this.emit('pause');
	});

	load = jest.fn();

	removeAttribute(name: string): void {
		if (name === 'src') this.src = '';
	}

	canPlayType(type: string): string {
		return type === 'application/vnd.apple.mpegurl' ? this.nativeHls : '';
	}

	addEventListener(type: string, listener: () => void): void {
		this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
	}

	emit(type: string): void {
		this.listeners.get(type)?.forEach(listener => listener());
	}

	loadStream(durationSeconds: number): void {
		this.duration = durationSeconds;
		this.readyState = 4;
		this.emit('loadedmetadata');
		this.emit('canplay');
	}

	finish(): void {
		this.currentTime = this.duration;
		this.ended = true;
		this.paused = true;
		this.emit('pause');
		this.emit('ended');
	}
}

export const autoplayRefusal = () =>
	Promise.reject(
		Object.assign(new Error('play() needs a user gesture'), { name: 'NotAllowedError' })
	);

/** The page's document creates this element; call before the player module creates its element. */
export function installFakeDocument(element: FakeMediaElement): void {
	Object.assign(globalThis, { document: { createElement: () => element } });
}
