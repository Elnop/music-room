import { useState } from 'react';
import { logger } from '@/shared/utils/logger';
import { showError } from '@/shared/utils/toast';
import {
	currentPlace,
	geocodeAddress,
	requestLocationPermission,
	type Coordinates,
} from '@/features/events/utils/eventLocation';

interface Located extends Coordinates {
	/** The address these coordinates belong to: typing another one geocodes it again. */
	address: string;
}

export interface EventPlace {
	isLocating: boolean;
	/** Fills the address from the phone's position. */
	locateHere: () => void;
	/** The coordinates of `address`, or null after telling the user why there are none. */
	resolve: (address: string) => Promise<Coordinates | null>;
}

const PERMISSION_NEEDED =
	"Autorisez la localisation pour situer l'adresse : Zumik ne l'envoie jamais au serveur";

export function useEventPlace(
	edited: Located | undefined,
	setAddress: (address: string) => void
): EventPlace {
	const [located, setLocated] = useState<Located | null>(() =>
		edited
			? { latitude: edited.latitude, longitude: edited.longitude, address: edited.address }
			: null
	);
	const [isLocating, setIsLocating] = useState(false);

	const locateHere = async () => {
		setIsLocating(true);
		try {
			if (!(await requestLocationPermission())) {
				showError(PERMISSION_NEEDED);
				return;
			}
			const place = await currentPlace();
			setLocated(place);
			setAddress(place.address);
		} catch (error) {
			logger.warn('[EventForm] Current position unavailable:', error);
			showError('Position introuvable : vérifiez que la localisation est activée');
		} finally {
			setIsLocating(false);
		}
	};

	const resolve = async (address: string): Promise<Coordinates | null> => {
		if (located && located.address.trim() === address.trim()) {
			return { latitude: located.latitude, longitude: located.longitude };
		}
		if (!(await requestLocationPermission())) {
			showError(PERMISSION_NEEDED);
			return null;
		}
		try {
			const coordinates = await geocodeAddress(address);
			if (!coordinates) showError('Adresse introuvable : précisez la ville ou le code postal');
			return coordinates;
		} catch (error) {
			logger.warn('[EventForm] Geocoding failed:', error);
			showError("Impossible de situer l'adresse pour le moment");
			return null;
		}
	};

	return {
		isLocating,
		locateHere: () => void locateHere(),
		resolve,
	};
}
