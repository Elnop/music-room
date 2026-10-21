import { logger } from '@/utils/logger';

// __DEV__ is a global the preset defines; flip it to test both builds.
const setDev = (value: boolean) => {
	(globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
};

describe('logger', () => {
	const dev = __DEV__;

	afterEach(() => {
		setDev(dev);
		jest.restoreAllMocks();
	});

	it('sends warn and error to the console with their context', () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

		logger.warn('[Test] degraded', { id: 1 });
		logger.error('[Test] failed');

		expect(warn).toHaveBeenCalledWith('[Test] degraded', { id: 1 });
		expect(error).toHaveBeenCalledWith('[Test] failed');
	});

	it('prints debug and info in development only', () => {
		const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
		const info = jest.spyOn(console, 'info').mockImplementation(() => undefined);

		setDev(true);
		logger.debug('[Test] detail');
		logger.info('[Test] event', 'ctx');
		expect(debug).toHaveBeenCalledWith('[Test] detail');
		expect(info).toHaveBeenCalledWith('[Test] event', 'ctx');

		debug.mockClear();
		info.mockClear();
		setDev(false);
		logger.debug('[Test] detail');
		logger.info('[Test] event');
		expect(debug).not.toHaveBeenCalled();
		expect(info).not.toHaveBeenCalled();
	});

	it('keeps warn and error in release builds', () => {
		const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		setDev(false);

		logger.error('[Test] failed', new Error('x'));

		expect(error).toHaveBeenCalledWith('[Test] failed', expect.any(Error));
	});
});
