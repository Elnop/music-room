import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';

export type TrackActionsStep = 'actions' | 'playlists' | 'newPlaylist';

export type NewPlaylistDraft = {
	name: string;
	setName: (name: string) => void;
	error?: string;
	creating: boolean;
	start: () => void;
	submit: () => void;
};

export type DraftState = {
	name: string;
	error?: string;
	creating: boolean;
	rename: (name: string) => void;
	reset: (name: string) => void;
	setError: (error: string | undefined) => void;
	setCreating: (creating: boolean) => void;
};

export type NewPlaylistContext = {
	draft: DraftState;
	create: (input: { name: string }) => Promise<Playlist>;
	addTrack: (variables: { playlistId: string; track: AddQueueItemBody }) => Promise<void>;
	onClose: () => void;
	refreshList: () => void;
};

export type ActionStepMoves = {
	openPlaylists: () => void;
	backToActions: () => void;
	backToPlaylists: () => void;
};

export type ActionFlow = ActionStepMoves & {
	shown: AddQueueItemBody | null;
	step: TrackActionsStep;
	goTo: (step: TrackActionsStep) => void;
};

export type EditablePlaylists = {
	editable: Playlist[];
	loadingPlaylists: boolean;
};

export type TrackRunners = {
	playNext: () => void;
	addToQueue: () => void;
	addToPlaylist: (playlist: Playlist) => void;
	share: () => void;
};

export type TrackActions = ActionStepMoves &
	EditablePlaylists &
	TrackRunners & {
		visible: boolean;
		shown: AddQueueItemBody | null;
		step: TrackActionsStep;
		openNewPlaylist: () => void;
		newPlaylist: NewPlaylistDraft;
	};
