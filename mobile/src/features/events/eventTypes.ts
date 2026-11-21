import type { MusicGenre } from '@/shared/users/userTypes';

export type EventOrganizer = {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
};

export type EventPlaylist = {
	id: string;
	name: string;
	coverUrl?: string;
};

export type MusicEvent = {
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
	beaconMinor: number;
	organizer: EventOrganizer;
	playlist: EventPlaylist | null;
	createdAt: string;
	updatedAt: string;
};

export type Coordinates = {
	latitude: number;
	longitude: number;
};

export type GeocodedPlace = {
	latitude: number;
	longitude: number;
	displayName: string;
};

export type EventInput = {
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
};

export type PlaylistChoice = {
	id: string;
	name: string;
};

export type EventDeletedPayload = {
	eventId: string;
};

export type EventStackParamList = {
	EventDetail: { id: string };
	EventForm: { eventId?: string } | undefined;
	PlaylistDetail: { id: string };
};
