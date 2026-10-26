import type { AudioPlayer, AudioPlayerStatus } from '@/features/player/types';
import { mediaElement, setMediaEventHandler, type MediaElement } from './mediaElement';
import { attachStream } from './streamSource';

export interface PlaybackEvents {
	/** The browser refused to start playback before any interaction with the page. */
	onPlayBlocked: () => void;
	onPlaying: () => void;
}

const HAVE_METADATA = 1;
const HAVE_FUTURE_DATA = 3;

let ownerId: number | null = null;
let detachOwner: (() => void) | null = null;
let nextId = 1;

const isAutoplayRefusal = (error: unknown) =>
	(error as { name?: unknown } | null)?.name === 'NotAllowedError';

/** One player per stream URL, as expo-audio does; only the attached one drives the element. */
export class HtmlAudioPlayer implements AudioPlayer {
	readonly id = nextId++;
	private releaseStream: (() => void) | null = null;
	private failed = false;
	private lastTime = 0;
	private status: AudioPlayerStatus;
	private readonly listeners = new Set<() => void>();
	private readonly onFatal = () => this.handleMediaEvent('fatal');

	constructor(
		private readonly source: string,
		private readonly events: PlaybackEvents
	) {
		this.status = this.readStatus();
	}

	attach(): void {
		if (ownerId === this.id) return;
		detachOwner?.();
		ownerId = this.id;
		detachOwner = () => this.detach();
		setMediaEventHandler(type => this.handleMediaEvent(type));
		this.failed = false;
		if (this.source) this.releaseStream = attachStream(mediaElement(), this.source, this.onFatal);
		this.publish();
	}

	detach(): void {
		if (ownerId !== this.id) return;
		ownerId = null;
		detachOwner = null;
		setMediaEventHandler(null);
		mediaElement().pause();
		this.releaseStream?.();
		this.releaseStream = null;
		this.publish();
	}

	get playing(): boolean {
		const media = this.media();
		return media !== null && !media.paused && !media.ended;
	}

	get isLoaded(): boolean {
		const media = this.media();
		return media !== null && !this.failed && media.readyState >= HAVE_METADATA;
	}

	get duration(): number {
		const duration = this.media()?.duration ?? 0;
		return Number.isFinite(duration) && duration > 0 ? duration : 0;
	}

	get currentTime(): number {
		return this.media()?.currentTime ?? this.lastTime;
	}

	get volume(): number {
		return mediaElement().volume;
	}

	set volume(value: number) {
		mediaElement().volume = Math.min(1, Math.max(0, value));
	}

	play(): void {
		this.media()
			?.play()
			.catch(error => {
				if (isAutoplayRefusal(error)) this.events.onPlayBlocked();
			});
	}

	pause(): void {
		this.media()?.pause();
	}

	seekTo(seconds: number): Promise<void> {
		const media = this.media();
		if (media) media.currentTime = seconds;
		return Promise.resolve();
	}

	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	};

	getStatus = (): AudioPlayerStatus => this.status;

	private handleMediaEvent(type: string): void {
		if (type === 'fatal' || (type === 'error' && mediaElement().error)) this.failed = true;
		if (type === 'playing') this.events.onPlaying();
		this.publish();
	}

	private media(): MediaElement | null {
		return ownerId === this.id ? mediaElement() : null;
	}

	private publish(): void {
		this.lastTime = this.currentTime;
		this.status = this.readStatus();
		this.listeners.forEach(listener => listener());
	}

	private readStatus(): AudioPlayerStatus {
		const media = this.media();
		const readyState = media?.readyState ?? 0;
		const isLoaded = this.isLoaded;
		const didJustFinish = media?.ended ?? false;
		let playbackState = 'loading';
		if (!this.source) playbackState = 'idle';
		else if (this.failed) playbackState = 'failed';
		else if (didJustFinish) playbackState = 'ended';
		else if (isLoaded) playbackState = readyState >= HAVE_FUTURE_DATA ? 'ready' : 'buffering';
		return {
			id: this.id,
			playing: this.playing,
			isLoaded,
			isBuffering: this.playing && readyState < HAVE_FUTURE_DATA,
			duration: this.duration,
			currentTime: this.currentTime,
			didJustFinish,
			playbackState,
		};
	}
}
