import { acquireListening, releaseListening } from './listeningRooms';

const makeSocket = () => ({ connected: true, emit: jest.fn() });

describe('listeningRooms', () => {
	it('subscribes on the first holder and unsubscribes on the last', () => {
		const socket = makeSocket();
		acquireListening(socket, 'friend');
		acquireListening(socket, 'friend');
		expect(socket.emit.mock.calls).toEqual([['listening:subscribe', 'friend']]);

		releaseListening(socket, 'friend');
		expect(socket.emit).toHaveBeenCalledTimes(1);
		releaseListening(socket, 'friend');
		expect(socket.emit).toHaveBeenLastCalledWith('listening:unsubscribe', 'friend');
		expect(socket.emit).toHaveBeenCalledTimes(2);
	});

	it('counts each owner apart and ignores an extra release', () => {
		const socket = makeSocket();
		acquireListening(socket, 'a');
		acquireListening(socket, 'b');
		releaseListening(socket, 'a');
		releaseListening(socket, 'a');
		expect(socket.emit.mock.calls).toEqual([
			['listening:subscribe', 'a'],
			['listening:subscribe', 'b'],
			['listening:unsubscribe', 'a'],
		]);
	});

	it('re-subscribes after a disconnect released every holder', () => {
		const socket = makeSocket();
		acquireListening(socket, 'friend');
		socket.connected = false;
		releaseListening(socket, 'friend');
		expect(socket.emit).toHaveBeenCalledTimes(1);
		socket.connected = true;
		acquireListening(socket, 'friend');
		expect(socket.emit).toHaveBeenLastCalledWith('listening:subscribe', 'friend');
	});

	it('keeps counts per socket: a new connection subscribes again', () => {
		const first = makeSocket();
		const second = makeSocket();
		acquireListening(first, 'friend');
		acquireListening(second, 'friend');
		expect(second.emit).toHaveBeenCalledWith('listening:subscribe', 'friend');
	});
});
