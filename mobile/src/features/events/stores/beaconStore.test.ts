import { logger } from '@/shared/utils/logger';
import {
	AdvertiseError,
	startEventBeacon,
	stopEventBeacon,
} from '@/features/events/services/beaconAdvertiser';
import { useBeaconStore } from './beaconStore';

jest.mock('@/features/events/services/beaconAdvertiser', () => {
	const actual = jest.requireActual('@/features/events/services/beaconAdvertiser');
	return {
		AdvertiseError: actual.AdvertiseError,
		startEventBeacon: jest.fn(),
		stopEventBeacon: jest.fn(),
	};
});

const start = jest.mocked(startEventBeacon);
const event = (endsIn: number) => ({
	id: 'e1',
	beaconMinor: 42,
	endsAt: new Date(Date.now() + endsIn).toISOString(),
});

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	useBeaconStore.setState({ eventId: null, status: 'idle' });
});

afterEach(() => jest.useRealTimers());

describe('beaconStore', () => {
	it('broadcasts the event minor until the event ends', async () => {
		start.mockResolvedValue();
		await expect(useBeaconStore.getState().start(event(60_000))).resolves.toBeNull();
		expect(start).toHaveBeenCalledWith(42);
		expect(useBeaconStore.getState()).toMatchObject({ eventId: 'e1', status: 'broadcasting' });

		jest.advanceTimersByTime(60_000);
		expect(stopEventBeacon).toHaveBeenCalled();
		expect(useBeaconStore.getState()).toMatchObject({ eventId: null, status: 'idle' });
	});

	it('reports why it could not start, and stays idle', async () => {
		start.mockRejectedValue(new AdvertiseError('bluetooth-off'));
		await expect(useBeaconStore.getState().start(event(60_000))).resolves.toBe('bluetooth-off');
		expect(useBeaconStore.getState().status).toBe('idle');
	});

	it('stops when asked', async () => {
		start.mockResolvedValue();
		await useBeaconStore.getState().start(event(60_000));
		useBeaconStore.getState().stop();
		expect(stopEventBeacon).toHaveBeenCalled();
		jest.advanceTimersByTime(60_000);
		expect(stopEventBeacon).toHaveBeenCalledTimes(1);
	});
});
