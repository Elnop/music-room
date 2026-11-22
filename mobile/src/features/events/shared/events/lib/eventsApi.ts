import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type { EventInput, MusicEvent } from '@/features/events/eventTypes';

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
