import { apiRequest } from '@/shared/services/api';
import type {
	EventInput,
	GeocodedPlace,
	MusicEvent,
	PlaylistChoice,
} from '@/features/events/types';

/** Ongoing and upcoming events, with their coordinates: the phone computes distances itself. */
export async function fetchEvents(): Promise<MusicEvent[]> {
	const data = await apiRequest<{ events: MusicEvent[] }>('/api/events');
	return data.events;
}

export async function fetchEvent(id: string): Promise<MusicEvent> {
	const data = await apiRequest<{ event: MusicEvent }>(`/api/events/${id}`);
	return data.event;
}

export async function createEvent(input: EventInput): Promise<MusicEvent> {
	const data = await apiRequest<{ event: MusicEvent }>('/api/events', {
		method: 'POST',
		body: JSON.stringify(input),
	});
	return data.event;
}

export async function updateEvent(id: string, changes: Partial<EventInput>): Promise<MusicEvent> {
	const data = await apiRequest<{ event: MusicEvent }>(`/api/events/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(changes),
	});
	return data.event;
}

export async function deleteEvent(id: string): Promise<void> {
	await apiRequest(`/api/events/${id}`, { method: 'DELETE' });
}

/** Only the typed address leaves the device; null when no place matches. */
export async function geocode(address: string): Promise<GeocodedPlace | null> {
	const data = await apiRequest<{ location: GeocodedPlace | null }>(
		`/api/events/geocode?q=${encodeURIComponent(address)}`
	);
	return data.location;
}

interface OwnPlaylist {
	id: string;
	name: string;
	ownerId: string;
	visibility: 'public' | 'private';
}

/** The backend only accepts a public playlist of the organiser. */
export async function fetchPlaylistChoices(userId: string): Promise<PlaylistChoice[]> {
	const data = await apiRequest<{ playlists: OwnPlaylist[] }>('/api/playlists');
	return data.playlists
		.filter(playlist => playlist.ownerId === userId && playlist.visibility === 'public')
		.map(({ id, name }) => ({ id, name }));
}
