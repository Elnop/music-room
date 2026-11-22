export type MediaElement = {
	src: string;
	currentTime: number;
	volume: number;
	preload: string;
	readonly duration: number;
	readonly paused: boolean;
	readonly ended: boolean;
	readonly readyState: number;
	readonly error: unknown;
	play: () => Promise<void>;
	pause: () => void;
	load: () => void;
	removeAttribute: (name: string) => void;
	canPlayType: (type: string) => string;
	addEventListener: (type: string, listener: () => void) => void;
};
