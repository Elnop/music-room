import type { MusicGenre } from '@/types/user.types';

/** displayName and avatarUrl are absent when unset. */
export interface EventOrganizer {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

export interface EventPlaylist {
	id: string;
	name: string;
	coverUrl?: string;
}

/** A physical event (party, concert, bar); "Event" alone would shadow the DOM type. */
export interface MusicEvent {
	id: string;
	name: string;
	description?: string;
	address: string;
	latitude: number;
	longitude: number;
	accessInfo?: string;
	genres: MusicGenre[];
	startsAt: string;
	endsAt: string;
	/** Minor of the iBeacon frame the organiser's phone broadcasts. */
	beaconMinor: number;
	organizer: EventOrganizer;
	/** Null when none, or once the playlist is no longer public. */
	playlist: EventPlaylist | null;
	createdAt: string;
	updatedAt: string;
}

export interface EventInput {
	name: string;
	description: string | null;
	address: string;
	latitude: number;
	longitude: number;
	accessInfo: string | null;
	genres: MusicGenre[];
	startsAt: string;
	endsAt: string;
	playlistId: string | null;
}

/** A public playlist of mine that an event can link to. */
export interface PlaylistChoice {
	id: string;
	name: string;
}

export interface EventDeletedPayload {
	eventId: string;
}

/** The routes the event screens use; the stack also holds the playlist screens. */
export type EventStackParamList = {
	EventDetail: { id: string };
	/** With an eventId, the form edits that event. */
	EventForm: { eventId?: string } | undefined;
	PlaylistDetail: { id: string };
};
