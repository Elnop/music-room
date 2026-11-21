import { createStore } from 'zustand/vanilla';
import { logger } from '@/shared/logging/logger';
import { AdvertiseError } from '@/features/events/features/detail/lib/AdvertiseError';
import {
	startEventBeacon,
	stopEventBeacon,
} from '@/features/events/features/detail/lib/beaconAdvertiser';
import type { AdvertiseFailure } from '@/features/events/features/detail/eventDetailTypes';

type BeaconStatus = 'idle' | 'starting' | 'broadcasting';

type BeaconState = {
	eventId: string | null;
	status: BeaconStatus;
};

type BroadcastEvent = {
	id: string;
	beaconMinor: number;
	endsAt: string;
};

const MAX_TIMER_MS = 2_147_483_647;
let endTimer: ReturnType<typeof setTimeout> | null = null;

export const beaconStore = createStore<BeaconState>(() => ({
	eventId: null,
	status: 'idle',
}));

function clearEndTimer(): void {
	if (endTimer) clearTimeout(endTimer);
	endTimer = null;
}

function stopBeacon(): void {
	clearEndTimer();
	stopEventBeacon();
	beaconStore.setState({ eventId: null, status: 'idle' });
}

async function startBeacon(event: BroadcastEvent): Promise<AdvertiseFailure | null> {
	clearEndTimer();
	beaconStore.setState({ eventId: event.id, status: 'starting' });
	try {
		await startEventBeacon(event.beaconMinor);
	} catch (error) {
		const reason = error instanceof AdvertiseError ? error.reason : 'failed';
		logger.warn('[beaconStore] Could not broadcast the beacon:', error);
		beaconStore.setState({ eventId: null, status: 'idle' });
		return reason;
	}
	if (beaconStore.getState().eventId !== event.id) return null;
	beaconStore.setState({ status: 'broadcasting' });
	const left = Math.min(Date.parse(event.endsAt) - Date.now(), MAX_TIMER_MS);
	endTimer = setTimeout(stopBeacon, Math.max(0, left));
	return null;
}

export const beaconActions = {
	start: startBeacon,
	stop: stopBeacon,
};
