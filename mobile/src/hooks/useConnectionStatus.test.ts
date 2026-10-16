import { renderHook } from '@testing-library/react-native';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import type { SocketStatus } from '@store/socketStore';

let mockNetwork: { isConnected?: boolean; isInternetReachable?: boolean } = {};
const mockSocketState = { status: 'connected' as SocketStatus, retry: jest.fn() };

jest.mock('expo-network', () => ({ useNetworkState: () => mockNetwork }));

jest.mock('@store/socketStore', () => ({
	useSocketStore: (selector: (state: typeof mockSocketState) => unknown) =>
		selector(mockSocketState),
}));

const ONLINE = { isConnected: true, isInternetReachable: true };

beforeEach(() => {
	jest.clearAllMocks();
	mockNetwork = ONLINE;
	mockSocketState.status = 'connected';
});

function render() {
	return renderHook(() => useConnectionStatus());
}

describe('useConnectionStatus', () => {
	it('hides the banner when online and connected', () => {
		expect(render().result.current).toBeNull();
	});

	it.each<SocketStatus>(['idle', 'connecting'])(
		'hides the banner when the socket is %s',
		status => {
			mockSocketState.status = status;
			expect(render().result.current).toBeNull();
		}
	);

	it('counts an unknown network state as online', () => {
		mockNetwork = {};
		expect(render().result.current).toBeNull();
	});

	it.each([
		{ isConnected: false, isInternetReachable: false },
		{ isConnected: false },
		{ isConnected: true, isInternetReachable: false },
	])('is offline for %o, whatever the socket says', network => {
		mockNetwork = network;
		mockSocketState.status = 'connected';
		expect(render().result.current).toBe('offline');
		mockSocketState.status = 'failed';
		expect(render().result.current).toBe('offline');
	});

	it('is reconnecting while the socket retries', () => {
		mockSocketState.status = 'reconnecting';
		expect(render().result.current).toBe('reconnecting');
	});

	it('is failed once the socket gave up', () => {
		mockSocketState.status = 'failed';
		expect(render().result.current).toBe('failed');
		expect(mockSocketState.retry).not.toHaveBeenCalled();
	});

	it('retries a failed socket when the network comes back', () => {
		mockNetwork = { isConnected: false, isInternetReachable: false };
		mockSocketState.status = 'failed';
		const { rerender, result } = render();
		expect(mockSocketState.retry).not.toHaveBeenCalled();

		mockNetwork = ONLINE;
		rerender({});

		expect(mockSocketState.retry).toHaveBeenCalledTimes(1);
		expect(result.current).toBe('failed');
	});

	it('retries once when the socket gives up after the network came back', () => {
		mockNetwork = { isConnected: false };
		mockSocketState.status = 'reconnecting';
		const { rerender } = render();

		mockNetwork = ONLINE;
		rerender({});
		expect(mockSocketState.retry).not.toHaveBeenCalled();

		mockSocketState.status = 'failed';
		rerender({});
		expect(mockSocketState.retry).toHaveBeenCalledTimes(1);

		// Still failed after that retry: the user taps « Réessayer ».
		rerender({});
		expect(mockSocketState.retry).toHaveBeenCalledTimes(1);
	});

	it('does not retry a failed socket when the network was never lost', () => {
		mockSocketState.status = 'failed';
		const { rerender } = render();
		rerender({});
		expect(mockSocketState.retry).not.toHaveBeenCalled();
	});

	it('forgets a network loss once the socket reconnected', () => {
		mockNetwork = { isConnected: false };
		const { rerender } = render();
		mockNetwork = ONLINE;
		rerender({});
		mockSocketState.status = 'connected';
		rerender({});

		mockSocketState.status = 'failed';
		rerender({});
		expect(mockSocketState.retry).not.toHaveBeenCalled();
	});
});
