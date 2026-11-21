import { logger } from '@/shared/logging/logger';
import { showError } from '@/shared/theme/lib/toast';
import {
	currentPlace,
	requestLocationPermission,
} from '@/features/events/shared/location/lib/eventLocation';
import { geocodeAddress } from '@/features/events/shared/location/lib/geocoder';
import { GEOCODER_NEEDS_LOCATION_PERMISSION } from '@/features/events/features/event-form/eventFormConfig';
import type { Located } from '@/features/events/features/event-form/types/eventFormTypes';
import type { Coordinates } from '@/features/events/eventTypes';

const POSITION_PERMISSION_NEEDED =
	"Autorisez la localisation pour utiliser votre position : Zumik ne l'envoie jamais au serveur";
const PERMISSION_NEEDED =
	"Autorisez la localisation pour situer l'adresse : Zumik ne l'envoie jamais au serveur";

export async function locateCurrentPlace(): Promise<Located | null> {
	try {
		if (!(await requestLocationPermission())) {
			showError(POSITION_PERMISSION_NEEDED);
			return null;
		}
		return await currentPlace();
	} catch (error) {
		logger.warn('[EventForm] Current position unavailable:', error);
		showError('Position introuvable : vérifiez que la localisation est activée');
		return null;
	}
}

async function geocodeTypedAddress(address: string): Promise<Coordinates | null> {
	try {
		const coordinates = await geocodeAddress(address);
		if (!coordinates) showError('Adresse introuvable : précisez la ville ou le code postal');
		return coordinates;
	} catch (error) {
		logger.warn('[EventForm] Geocoding failed:', error);
		showError("Impossible de situer l'adresse pour le moment");
		return null;
	}
}

export async function resolveAddress(
	located: Located | null,
	address: string
): Promise<Coordinates | null> {
	if (located && located.address.trim() === address.trim()) {
		return { latitude: located.latitude, longitude: located.longitude };
	}
	if (GEOCODER_NEEDS_LOCATION_PERMISSION && !(await requestLocationPermission())) {
		showError(PERMISSION_NEEDED);
		return null;
	}
	return geocodeTypedAddress(address);
}
