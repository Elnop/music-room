import type { z } from 'zod';
import type { Tables } from '@/shared/types/supabase.generated.js';
import type {
	eventSchema,
	geocodedPlaceSchema,
} from '@/features/events/events-responses.validators.js';

export type Event = z.infer<typeof eventSchema>;

export type GeocodedPlace = z.infer<typeof geocodedPlaceSchema>;

export type EventRow = Tables<'events'>;

export type EventRowWithRelations = EventRow & {
	owner: Pick<Tables<'user_profiles'>, 'id' | 'username' | 'display_name' | 'avatar_url'>;
	playlist: Pick<
		Tables<'playlists'>,
		'id' | 'name' | 'cover_url' | 'visibility' | 'owner_id'
	> | null;
};

export interface EventDeletedPayload {
	eventId: string;
}
