import { useShallow } from 'zustand/shallow';
import { showError, showSuccess } from '@/shared/utils/toast';
import { useBeaconStore } from '@/features/events/stores/beaconStore';
import { isOngoing } from '@/features/events/utils/eventDates';
import type { AdvertiseFailure } from '@/features/events/services/beaconAdvertiser';
import type { MusicEvent } from '@/features/events/types';

export interface BeaconBroadcast {
	/** Only while the event is on. */
	available: boolean;
	active: boolean;
	starting: boolean;
	toggle: (on: boolean) => void;
}

const FAILURES: Record<AdvertiseFailure, string> = {
	'permission-denied':
		'Autorisez « Appareils à proximité » dans les réglages pour diffuser la balise',
	'bluetooth-off': 'Activez le Bluetooth pour diffuser la balise',
	unsupported: 'Ce téléphone ne peut pas émettre de balise Bluetooth',
	failed: "La balise n'a pas pu démarrer, réessayez",
};

export function useBeaconBroadcast(event: MusicEvent | undefined): BeaconBroadcast {
	const { eventId, status, start, stop } = useBeaconStore(
		useShallow(state => ({
			eventId: state.eventId,
			status: state.status,
			start: state.start,
			stop: state.stop,
		}))
	);
	const mine = event !== undefined && eventId === event.id;

	const toggle = (on: boolean) => {
		if (!event) return;
		if (!on) {
			stop();
			return;
		}
		void start(event).then(failure => {
			if (failure) showError(FAILURES[failure]);
			else showSuccess('Balise diffusée : les téléphones proches voient votre événement');
		});
	};

	return {
		available: event !== undefined && isOngoing(event),
		active: mine && status === 'broadcasting',
		starting: mine && status === 'starting',
		toggle,
	};
}
