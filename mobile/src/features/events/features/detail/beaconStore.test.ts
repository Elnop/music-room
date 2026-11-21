import { logger } from '@/shared/logging/logger';
import { AdvertiseError } from '@/features/events/features/detail/lib/AdvertiseError';
import {
	startEventBeacon,
	stopEventBeacon,
} from '@/features/events/features/detail/lib/beaconAdvertiser';
import { beaconActions, beaconStore } from '@/features/events/features/detail/beaconStore';

jest.mock('@/features/events/features/detail/lib/beaconAdvertiser', () => ({
	startEventBeacon: jest.fn(),
	stopEventBeacon: jest.fn(),
}));

const start = jest.mocked(startEventBeacon);
function event(endsIn: number) {
	return {
		id: 'e1',
		beaconMinor: 42,
		endsAt: new Date(Date.now() + endsIn).toISOString(),
	};
}

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	beaconStore.setState({ eventId: null, status: 'idle' });
});

afterEach(() => jest.useRealTimers());

describe('beaconStore', () => {
	it('broadcasts the event minor until the event ends', async () => {
		start.mockResolvedValue();
		await expect(beaconActions.start(event(60_000))).resolves.toBeNull();
		expect(start).toHaveBeenCalledWith(42);
		expect(beaconStore.getState()).toMatchObject({ eventId: 'e1', status: 'broadcasting' });

		jest.advanceTimersByTime(60_000);
		expect(stopEventBeacon).toHaveBeenCalledWith();
		expect(beaconStore.getState()).toMatchObject({ eventId: null, status: 'idle' });
	});

	it('reports why it could not start, and stays idle', async () => {
		start.mockRejectedValue(new AdvertiseError('bluetooth-off'));
		await expect(beaconActions.start(event(60_000))).resolves.toBe('bluetooth-off');
		expect(beaconStore.getState().status).toBe('idle');
	});

	it('stops when asked', async () => {
		start.mockResolvedValue();
		await beaconActions.start(event(60_000));
		beaconActions.stop();
		expect(stopEventBeacon).toHaveBeenCalledWith();
		jest.advanceTimersByTime(60_000);
		expect(stopEventBeacon).toHaveBeenCalledTimes(1);
	});
});
