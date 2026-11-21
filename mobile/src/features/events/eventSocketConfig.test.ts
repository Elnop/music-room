import { createQueryClient } from '@/shared/backend/queryClient';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import type { MusicEvent } from '@/features/events/eventTypes';
import { musicEvent } from '@test-utils/musicEvent';
import { EVENT_SOCKET_RULES } from '@/features/events/eventSocketConfig';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.2.3' }));

const client = createQueryClient();

function emit(event: string, payload: unknown) {
	for (const rule of EVENT_SOCKET_RULES.filter(current => current.event === event)) {
		rule.apply(client, payload);
	}
}
function shown() {
	return client.getQueryData<MusicEvent[]>(queryKeys.events.list())?.map(event => event.name);
}

beforeEach(() => {
	client.clear();
	client.setQueryData<MusicEvent[]>(queryKeys.events.list(), [musicEvent()]);
});

afterAll(() => client.clear());

describe('EVENT_SOCKET_RULES', () => {
	it('adds an event created on another phone, without a refetch', () => {
		emit('event:created', musicEvent({ id: 'e2', name: 'Bar' }));
		expect(shown()).toStrictEqual(['Rooftop', 'Bar']);
	});

	it('updates the list and the detail', () => {
		client.setQueryData(queryKeys.events.detail('e1'), musicEvent());
		emit('event:updated', musicEvent({ name: 'Renamed' }));
		expect(shown()).toStrictEqual(['Renamed']);
		expect(client.getQueryData<MusicEvent>(queryKeys.events.detail('e1'))?.name).toBe('Renamed');
	});

	it('removes a deleted event', () => {
		emit('event:deleted', { eventId: 'e1' });
		expect(shown()).toStrictEqual([]);
	});
});
