import type { RefObject } from 'react';

export type PlayableTrack = { id: string; trackUri: string };

export type PlayPlaylist = {
	loading: boolean;
	playing: boolean;
	press: () => void;
	pendingTrackId: string | null;
	playFrom: (track: PlayableTrack) => void;
};

export type PendingPlay = {
	active: boolean;
	trackId: string | null;
};

export type PlayStart = {
	pending: PendingPlay;
	pendingRef: RefObject<boolean>;
	start: (startTrackId?: string) => Promise<void>;
};
