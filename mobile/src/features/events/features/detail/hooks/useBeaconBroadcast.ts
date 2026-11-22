import { useShallow } from 'zustand/shallow';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { beaconActions } from '@/features/events/features/detail/beaconStore';
import { useBeaconState } from '@/features/events/features/detail/hooks/useBeaconState';
import { isOngoing } from '@/features/events/shared/event-dates/eventDates';
import type {
	AdvertiseFailure,
	BeaconBroadcast,
} from '@/features/events/features/detail/eventDetailTypes';
import type { MusicEvent } from '@/features/events/eventTypes';

const FAILURES: Record<AdvertiseFailure, string> = {
	'permission-denied':
		'Autorisez « Appareils à proximité » dans les réglages pour diffuser la balise',
	'bluetooth-off': 'Activez le Bluetooth pour diffuser la balise',
	unsupported: 'Ce téléphone ne peut pas émettre de balise Bluetooth',
	failed: "La balise n'a pas pu démarrer, réessayez",
};

export function useBeaconBroadcast(event: MusicEvent | undefined): BeaconBroadcast {
	const { eventId, status } = useBeaconState(
		useShallow((state) => ({ eventId: state.eventId, status: state.status })),
	);
	const mine = event !== undefined && eventId === event.id;

	function toggle(on: boolean) {
		if (!event) return;
		if (!on) {
			beaconActions.stop();
			return;
		}
		void beaconActions.start(event).then((failure) => {
			if (failure) showError(FAILURES[failure]);
			else showSuccess('Balise diffusée : les téléphones proches voient votre événement');
		});
	}

	return {
		available: event !== undefined && isOngoing(event),
		active: mine && status === 'broadcasting',
		starting: mine && status === 'starting',
		toggle,
	};
}
