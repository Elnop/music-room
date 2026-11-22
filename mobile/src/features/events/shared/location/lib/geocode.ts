import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type { GeocodedPlace } from '@/features/events/eventTypes';

export async function geocode(address: string): Promise<GeocodedPlace | null> {
	const data = await apiRequest<{ location: GeocodedPlace | null }>(
		`/api/events/geocode?q=${encodeURIComponent(address)}`,
	);
	return data.location;
}
