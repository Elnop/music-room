export type RemoteDevice = {
	ownerId: string;
	deviceId: string;
};

export type StreamWatch = {
	loadedId: number | null;
	handledId: number | null;
	lastPositionMs: number;
};

export type WatchedStatus = {
	id: number | undefined;
	playbackState: string | undefined;
	isLoaded: boolean;
	currentTime: number;
};

export type NextQueueItem = {
	currentId: string | null;
	playingItemId: string | null;
	id: string | null;
	permalink: string | null;
	key: string | null;
	stepping: boolean;
};
