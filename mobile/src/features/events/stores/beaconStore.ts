import { create } from 'zustand';
import { logger } from '@/shared/utils/logger';
import {
	AdvertiseError,
	startEventBeacon,
	stopEventBeacon,
	type AdvertiseFailure,
} from '@/features/events/services/beaconAdvertiser';

type BeaconStatus = 'idle' | 'starting' | 'broadcasting';

interface BeaconState {
	/** The event whose beacon this phone broadcasts (one at a time). */
	eventId: string | null;
	status: BeaconStatus;
	/** Resolves with the reason it could not start, or null once broadcasting. */
	start: (event: {
		id: string;
		beaconMinor: number;
		endsAt: string;
	}) => Promise<AdvertiseFailure | null>;
	stop: () => void;
}

// setTimeout cannot wait longer than about 24.8 days.
const MAX_TIMER_MS = 2_147_483_647;
let endTimer: ReturnType<typeof setTimeout> | null = null;

function clearEndTimer(): void {
	if (endTimer) clearTimeout(endTimer);
	endTimer = null;
}

export const useBeaconStore = create<BeaconState>((set, get) => ({
	eventId: null,
	status: 'idle',
	start: async event => {
		clearEndTimer();
		set({ eventId: event.id, status: 'starting' });
		try {
			await startEventBeacon(event.beaconMinor);
		} catch (error) {
			const reason = error instanceof AdvertiseError ? error.reason : 'failed';
			logger.warn('[beaconStore] Could not broadcast the beacon:', error);
			set({ eventId: null, status: 'idle' });
			return reason;
		}
		if (get().eventId !== event.id) return null;
		set({ status: 'broadcasting' });
		// Broadcasting stops on its own when the event ends.
		const left = Math.min(Date.parse(event.endsAt) - Date.now(), MAX_TIMER_MS);
		endTimer = setTimeout(() => get().stop(), Math.max(0, left));
		return null;
	},
	stop: () => {
		clearEndTimer();
		stopEventBeacon();
		set({ eventId: null, status: 'idle' });
	},
}));
