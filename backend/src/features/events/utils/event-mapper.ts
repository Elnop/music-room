import { parseGenres } from '@/shared/music/genres.js';
import type { Event, EventRowWithRelations } from '@/features/events/events.types.js';

/** Embeds the organiser and the linked playlist through their foreign keys. */
export const EVENT_COLUMNS =
	'*, owner:user_profiles!events_owner_id_fkey(id, username, display_name, avatar_url), playlist:playlists(id, name, cover_url, visibility, owner_id)';

function linkedPlaylist(row: EventRowWithRelations): Event['playlist'] {
	const { playlist } = row;
	if (!playlist || playlist.visibility !== 'public' || playlist.owner_id !== row.owner_id) {
		return null;
	}
	return { id: playlist.id, name: playlist.name, coverUrl: playlist.cover_url ?? undefined };
}

export function toEvent(row: EventRowWithRelations): Event {
	return {
		id: row.id,
		name: row.name,
		description: row.description ?? undefined,
		address: row.address,
		latitude: row.latitude,
		longitude: row.longitude,
		accessInfo: row.access_info ?? undefined,
		genres: parseGenres(row.genres),
		startsAt: new Date(row.starts_at).toISOString(),
		endsAt: new Date(row.ends_at).toISOString(),
		beaconMinor: row.beacon_minor,
		organizer: {
			id: row.owner.id,
			username: row.owner.username,
			displayName: row.owner.display_name ?? undefined,
			avatarUrl: row.owner.avatar_url ?? undefined,
		},
		playlist: linkedPlaylist(row),
		createdAt: new Date(row.created_at).toISOString(),
		updatedAt: new Date(row.updated_at).toISOString(),
	};
}
