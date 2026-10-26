import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { EventRow } from '@/features/events/events.types.js';

export async function loadOwnedEvent(eventId: string, userId: string): Promise<EventRow> {
	const { data: event, error } = await supabaseAdmin
		.from('events')
		.select('*')
		.eq('id', eventId)
		.maybeSingle();

	if (error) throw error;
	if (!event) throw new AppError(404, 'Event not found', 'EVENT_NOT_FOUND');
	if (event.owner_id !== userId) {
		throw new AppError(403, 'Only the organiser can change this event', 'EVENT_ACCESS_DENIED');
	}
	return event;
}

/** A linked playlist must be public and belong to the event's creator. */
export async function assertLinkablePlaylist(playlistId: string, userId: string): Promise<void> {
	const { data: playlist, error } = await supabaseAdmin
		.from('playlists')
		.select('owner_id, visibility')
		.eq('id', playlistId)
		.maybeSingle();

	if (error) throw error;
	if (!playlist || playlist.owner_id !== userId || playlist.visibility !== 'public') {
		throw new AppError(
			400,
			'The linked playlist must be one of your public playlists',
			'EVENT_PLAYLIST_INVALID'
		);
	}
}
