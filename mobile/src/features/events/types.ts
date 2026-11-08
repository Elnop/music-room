import type { MusicGenre } from '@/types/user.types';

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
	beaconMinor: number;
	organizer: EventOrganizer;
	playlist: EventPlaylist | null;
	createdAt: string;
	updatedAt: string;
}

export interface GeocodedPlace {
	latitude: number;
	longitude: number;
	displayName: string;
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

export interface PlaylistChoice {
	id: string;
	name: string;
}

export interface EventDeletedPayload {
	eventId: string;
}

export type EventStackParamList = {
	EventDetail: { id: string };
	EventForm: { eventId?: string } | undefined;
	PlaylistDetail: { id: string };
};
