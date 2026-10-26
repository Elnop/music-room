import { Platform } from 'react-native';
import type { PositionState } from '@/features/events/nearby/hooks/useForegroundPosition';

export interface NearbyNotice {
	message: string;
	action?: 'request' | 'settings';
}

function privacy(): string {
	return Platform.OS === 'web'
		? 'Votre position reste dans votre navigateur.'
		: 'Votre position reste sur votre téléphone.';
}

/** No page can open a browser's site settings: the user changes them from the address bar. */
function denied(): NearbyNotice {
	if (Platform.OS === 'web') {
		return {
			message: `La localisation est refusée : autorisez-la dans les paramètres du site, depuis la barre d'adresse du navigateur. ${privacy()}`,
		};
	}
	return {
		message: `La localisation est refusée : autorisez-la dans les réglages pour voir les événements autour de vous. ${privacy()}`,
		action: 'settings',
	};
}

/** What the section says when it lists nothing: why, and what the user can do. */
export function nearbyNotice(state: PositionState): NearbyNotice {
	switch (state.status) {
		case 'needs-permission':
			return {
				message: `Autorisez la localisation pour voir les événements autour de vous. ${privacy()}`,
				action: 'request',
			};
		case 'denied':
			return denied();
		case 'disabled':
			return { message: 'Activez la localisation (GPS) pour voir les événements autour de vous.' };
		case 'checking':
		case 'waiting':
			return { message: 'Recherche de votre position…' };
		case 'located':
			return { message: 'Aucun événement à proximité' };
	}
}
