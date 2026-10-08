import { describe, expect, it, vi } from 'vitest';
import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';

const { info } = vi.hoisted(() => ({ info: vi.fn() }));

vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info, warn: vi.fn(), error: vi.fn() },
}));

describe('socketLogger.incoming', () => {
	it('logs the event with platform, device and app version from socket.data', () => {
		socketLogger.incoming('socket-1', 'playlist:join', {
			userId: 'user-a',
			device: { deviceId: 'dev-1', platform: 'android', model: 'Pixel 8' },
			appVersion: '1.2.3',
		});

		expect(info).toHaveBeenCalledWith('[Socket] in:playlist:join', {
			socketId: 'socket-1',
			userId: 'user-a',
			platform: 'android',
			device: 'Pixel 8',
			deviceId: 'dev-1',
			appVersion: '1.2.3',
		});
	});

	it.each([
		['too long', 'x'.repeat(65)],
		['multi-line', 'evil\n[Socket] forged line'],
		['not a string', { event: 'x' }],
	])('replaces a %s event name instead of logging it', (_case, eventName) => {
		socketLogger.incoming('socket-1', eventName, {
			userId: 'user-a',
			device: { deviceId: 'dev-1', platform: 'android', model: 'Pixel 8' },
			appVersion: '1.2.3',
		});

		expect(info).toHaveBeenLastCalledWith('[Socket] in:<invalid-event-name>', expect.any(Object));
	});
});
