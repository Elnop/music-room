import { createQueryClient } from '@/shared/query/queryClient';
import { queryKeys } from '@/shared/query/keys';
import type { MusicEvent } from '@/features/events/types';
import { musicEvent } from '@/test/eventFixtures';
import { EVENT_SOCKET_RULES } from './eventSocketRules';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));

const client = createQueryClient();
const list = queryKeys.events.list();

const emit = (event: string, payload: unknown) =>
	EVENT_SOCKET_RULES.filter(rule => rule.event === event).forEach(rule =>
		rule.apply(client, payload)
	);
const shown = () => client.getQueryData<MusicEvent[]>(list)?.map(event => event.name);

beforeEach(() => {
	client.clear();
	client.setQueryData<MusicEvent[]>(list, [musicEvent()]);
});

afterAll(() => client.clear());

describe('EVENT_SOCKET_RULES', () => {
	it('adds an event created on another phone, without a refetch', () => {
		emit('event:created', musicEvent({ id: 'e2', name: 'Bar' }));
		expect(shown()).toEqual(['Rooftop', 'Bar']);
	});

	it('updates the list and the detail', () => {
		client.setQueryData(queryKeys.events.detail('e1'), musicEvent());
		emit('event:updated', musicEvent({ name: 'Renamed' }));
		expect(shown()).toEqual(['Renamed']);
		expect(client.getQueryData<MusicEvent>(queryKeys.events.detail('e1'))?.name).toBe('Renamed');
	});

	it('removes a deleted event', () => {
		emit('event:deleted', { eventId: 'e1' });
		expect(shown()).toEqual([]);
	});
});
