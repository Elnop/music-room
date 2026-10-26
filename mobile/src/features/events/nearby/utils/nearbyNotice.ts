import type { PositionState } from '@/features/events/nearby/hooks/useForegroundPosition';

export interface NearbyNotice {
	message: string;
	action?: 'request' | 'settings';
}

const PRIVACY = 'Votre position reste sur votre téléphone.';

/** What the section says when it lists nothing: why, and what the user can do. */
export function nearbyNotice(state: PositionState): NearbyNotice {
	switch (state.status) {
		case 'needs-permission':
			return {
				message: `Autorisez la localisation pour voir les événements autour de vous. ${PRIVACY}`,
				action: 'request',
			};
		case 'denied':
			return {
				message: `La localisation est refusée : autorisez-la dans les réglages pour voir les événements autour de vous. ${PRIVACY}`,
				action: 'settings',
			};
		case 'disabled':
			return { message: 'Activez la localisation (GPS) pour voir les événements autour de vous.' };
		case 'checking':
		case 'waiting':
			return { message: 'Recherche de votre position…' };
		case 'located':
			return { message: 'Aucun événement à proximité' };
	}
}
