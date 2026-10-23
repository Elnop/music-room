import { acquireListening, releaseListening } from './listeningRooms';

function socket(connected = true) {
	return { connected, emit: jest.fn() };
}

describe('listeningRooms', () => {
	it('subscribes on the first holder and does not re-emit on the second', () => {
		const s = socket();
		acquireListening(s, 'user-1');
		expect(s.emit).toHaveBeenCalledTimes(1);
		expect(s.emit).toHaveBeenCalledWith('listening:subscribe', 'user-1');

		acquireListening(s, 'user-1');
		expect(s.emit).toHaveBeenCalledTimes(1);
	});

	it('unsubscribes only when the last holder leaves', () => {
		const s = socket();
		acquireListening(s, 'user-1');
		acquireListening(s, 'user-1');

		releaseListening(s, 'user-1');
		expect(s.emit).not.toHaveBeenCalledWith('listening:unsubscribe', 'user-1');

		releaseListening(s, 'user-1');
		expect(s.emit).toHaveBeenCalledWith('listening:unsubscribe', 'user-1');
	});

	it('does not unsubscribe if the socket is already disconnected', () => {
		const s = socket(false);
		acquireListening(s, 'user-1');
		releaseListening(s, 'user-1');
		expect(s.emit).not.toHaveBeenCalledWith('listening:unsubscribe', 'user-1');
	});

	it('isolates different sockets and different owners', () => {
		const s1 = socket();
		const s2 = socket();

		acquireListening(s1, 'user-1');
		acquireListening(s1, 'user-2');
		acquireListening(s2, 'user-1');

		expect(s1.emit).toHaveBeenCalledWith('listening:subscribe', 'user-1');
		expect(s1.emit).toHaveBeenCalledWith('listening:subscribe', 'user-2');
		expect(s2.emit).toHaveBeenCalledWith('listening:subscribe', 'user-1');
	});

	it('ignores a release when no holder was recorded', () => {
		const s = socket();
		expect(() => releaseListening(s, 'user-1')).not.toThrow();
		expect(s.emit).not.toHaveBeenCalled();
	});
});
