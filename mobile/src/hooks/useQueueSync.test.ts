import { renderHook } from '@testing-library/react-native';
import { useQueueSync } from '@/hooks/useQueueSync';
import type { QueueState } from '@/types/queue.types';

const mockSocket = {
	connected: true,
	on: jest.fn(),
	off: jest.fn(),
	emit: jest.fn(),
};

const mockSocketState = { socket: mockSocket, isConnected: true };
const mockQueueState = {
	load: jest.fn(),
	applyState: jest.fn(),
	reset: jest.fn(),
};
const mockAuthState = { user: { id: 'me' } };
let mockTarget: { kind: 'local' } | { kind: 'remote'; ownerId: string; deviceId: string } = {
	kind: 'local',
};

jest.mock('@store/socketStore', () => ({
	useSocketStore: (selector: (state: typeof mockSocketState) => unknown) =>
		selector(mockSocketState),
}));

jest.mock('@store/queueStore', () => ({
	useQueueStore: (selector: (state: typeof mockQueueState) => unknown) => selector(mockQueueState),
}));

jest.mock('@store/connectStore', () => ({
	useConnectStore: { getState: () => ({ target: mockTarget }) },
}));

jest.mock('@store/authStore', () => ({
	useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

function stateFor(ownerId: string): QueueState {
	return { ownerId, currentItemId: null } as unknown as QueueState;
}

/** Render the hook and return the queue:updated handler it registered. */
function setup() {
	renderHook(() => useQueueSync());
	const call = mockSocket.on.mock.calls.find(([event]) => event === 'queue:updated');
	return call?.[1] as (state: QueueState) => void;
}

beforeEach(() => {
	jest.clearAllMocks();
	mockTarget = { kind: 'local' };
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('useQueueSync queue:updated', () => {
	it('applies a state owned by the signed-in user', () => {
		const handler = setup();
		const state = stateFor('me');
		handler(state);
		expect(mockQueueState.applyState).toHaveBeenCalledWith(state);
	});

	it("ignores a state for another owner (a friend's queue seen as delegate)", () => {
		const handler = setup();
		handler(stateFor('friend'));
		expect(mockQueueState.applyState).not.toHaveBeenCalled();
	});

	it('applies the queue of the owner whose device the phone drives', () => {
		const handler = setup();
		mockTarget = { kind: 'remote', ownerId: 'friend', deviceId: 'tablet' };
		const state = stateFor('friend');
		handler(state);
		handler(stateFor('stranger'));
		expect(mockQueueState.applyState).toHaveBeenCalledTimes(1);
		expect(mockQueueState.applyState).toHaveBeenCalledWith(state);
	});
});
