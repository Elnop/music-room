// The project compiles without the DOM library, so the audio element is typed here.
export interface MediaElement {
	src: string;
	currentTime: number;
	volume: number;
	preload: string;
	readonly duration: number;
	readonly paused: boolean;
	readonly ended: boolean;
	readonly readyState: number;
	readonly error: unknown;
	play(): Promise<void>;
	pause(): void;
	load(): void;
	removeAttribute(name: string): void;
	canPlayType(type: string): string;
	addEventListener(type: string, listener: () => void): void;
}

interface BrowserDocument {
	createElement(tag: 'audio'): MediaElement;
}

const MEDIA_EVENTS = [
	'loadedmetadata',
	'durationchange',
	'timeupdate',
	'play',
	'playing',
	'pause',
	'waiting',
	'canplay',
	'seeked',
	'ended',
	'error',
	'volumechange',
];

// One element for the whole page: Safari unlocks sound per element, after a click on the page.
let element: MediaElement | null = null;
let eventHandler: ((type: string) => void) | null = null;

export function mediaElement(): MediaElement {
	if (element) return element;
	const { document } = globalThis as unknown as { document: BrowserDocument };
	const created = document.createElement('audio');
	created.preload = 'auto';
	for (const type of MEDIA_EVENTS) {
		created.addEventListener(type, () => eventHandler?.(type));
	}
	element = created;
	return created;
}

/** The element's events go to the player attached to it only. */
export function setMediaEventHandler(handler: ((type: string) => void) | null): void {
	eventHandler = handler;
}
